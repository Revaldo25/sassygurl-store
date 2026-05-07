using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Controllers;
using SassyGurl.Application.DTOs;
using SassyGurl.Application.Interfaces;
using SassyGurl.Domain.Entities;

namespace SassyGurl.Api.Middleware;

/// <summary>
/// Middleware that enforces idempotency on endpoints decorated with [Idempotency].
/// 
/// Request flow:
/// 1. Check if the endpoint has [Idempotency] attribute → if not, skip.
/// 2. Extract X-Idempotency-Key header → if missing, return 400.
/// 3. Validate UUID format → if invalid, return 400.
/// 4. Acquire distributed lock on the key → prevents race conditions.
/// 5. Check Redis for existing response:
///    a. If found → return cached response (replay) with 409 Conflict status.
///    b. If not found → proceed with the request.
/// 6. Capture the response body.
/// 7. Store the response in Redis with 24-hour TTL.
/// 8. Release the distributed lock.
/// 
/// This prevents double-transactions even in distributed/multi-node deployments.
/// </summary>
public class IdempotencyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<IdempotencyMiddleware> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public IdempotencyMiddleware(RequestDelegate next, ILogger<IdempotencyMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // ── Step 1: Check if endpoint has [Idempotency] attribute ──────
        var endpoint = context.GetEndpoint();
        var idempotencyAttr = endpoint?.Metadata.GetMetadata<IdempotencyAttribute>();

        if (idempotencyAttr is null)
        {
            // No idempotency required — pass through
            await _next(context);
            return;
        }

        // ── Step 2: Extract and validate the idempotency key ───────────
        var headerName = idempotencyAttr.HeaderName;
        if (!context.Request.Headers.TryGetValue(headerName, out var keyValues)
            || string.IsNullOrWhiteSpace(keyValues.FirstOrDefault()))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            var errorResponse = ApiErrorResponse.Create(
                $"Header '{headerName}' is required for this endpoint.",
                "MISSING_IDEMPOTENCY_KEY",
                context.TraceIdentifier);

            await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, JsonOptions));
            return;
        }

        var idempotencyKey = keyValues.First()!.Trim();

        // ── Step 3: Validate UUID format ───────────────────────────────
        if (!Guid.TryParse(idempotencyKey, out _))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            var errorResponse = ApiErrorResponse.Create(
                $"Header '{headerName}' must be a valid UUID.",
                "INVALID_IDEMPOTENCY_KEY",
                context.TraceIdentifier);

            await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, JsonOptions));
            return;
        }

        // Resolve scoped services
        var idempotencyService = context.RequestServices.GetRequiredService<IIdempotencyService>();
        var lockService = context.RequestServices.GetRequiredService<IDistributedLockService>();

        // ── Step 4: Acquire distributed lock ───────────────────────────
        // Lock resource format: "idempotency:{key}" with 30-second expiry.
        // The lock prevents two simultaneous requests with the same key
        // from both passing the "exists" check before either has cached a response.
        var lockResource = $"idempotency:{idempotencyKey}";
        await using var distributedLock = await lockService.AcquireLockAsync(
            lockResource,
            TimeSpan.FromSeconds(30));

        if (distributedLock is null)
        {
            // Lock acquisition failed — another node is processing this key
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/json";

            var errorResponse = ApiErrorResponse.Create(
                "This request is currently being processed. Please wait.",
                "IDEMPOTENCY_LOCK_CONFLICT",
                context.TraceIdentifier);

            await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, JsonOptions));
            return;
        }

        // ── Step 5: Check for existing cached response ─────────────────
        var existingRecord = await idempotencyService.GetAsync(idempotencyKey);

        if (existingRecord is not null)
        {
            _logger.LogInformation(
                "Idempotency key {Key} already processed. Returning cached response with status {StatusCode}.",
                idempotencyKey, existingRecord.StatusCode);

            context.Response.StatusCode = existingRecord.StatusCode;
            context.Response.ContentType = existingRecord.ContentType ?? "application/json";

            if (!string.IsNullOrEmpty(existingRecord.ResponseBody))
            {
                await context.Response.WriteAsync(existingRecord.ResponseBody);
            }
            return;
        }

        // ── Step 6: Process the request and capture response ───────────
        // Swap the response stream to capture the body for caching.
        var originalBodyStream = context.Response.Body;
        using var capturedBody = new MemoryStream();
        context.Response.Body = capturedBody;

        try
        {
            await _next(context);

            // ── Step 7: Cache the response ─────────────────────────────
            capturedBody.Seek(0, SeekOrigin.Begin);
            var responseBody = await new StreamReader(capturedBody).ReadToEndAsync();

            var record = new IdempotencyRecord
            {
                Key = idempotencyKey,
                StatusCode = context.Response.StatusCode,
                ResponseBody = responseBody,
                ContentType = context.Response.ContentType,
                CreatedAt = DateTime.UtcNow
            };

            await idempotencyService.SaveAsync(record);

            _logger.LogDebug(
                "Idempotency key {Key} processed and cached. Status: {StatusCode}.",
                idempotencyKey, context.Response.StatusCode);

            // Write the captured response to the original stream
            capturedBody.Seek(0, SeekOrigin.Begin);
            await capturedBody.CopyToAsync(originalBodyStream);
        }
        finally
        {
            // Always restore the original response stream
            context.Response.Body = originalBodyStream;
        }
    }
}

/// <summary>
/// Extension method for clean middleware registration in Program.cs.
/// Usage: app.UseIdempotency();
/// Must be registered AFTER authentication/authorization middleware
/// but BEFORE endpoint routing.
/// </summary>
public static class IdempotencyMiddlewareExtensions
{
    public static IApplicationBuilder UseIdempotency(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<IdempotencyMiddleware>();
    }
}

using System.Net;
using System.Text.Json;
using SassyGurl.Application.DTOs;
using SassyGurl.Domain.Exceptions;
using DomainValidationException = SassyGurl.Domain.Exceptions.ValidationException;

namespace SassyGurl.Api.Middleware;

/// <summary>
/// Global exception handler middleware that catches all unhandled exceptions
/// and transforms them into standardized JSON error responses.
/// 
/// Response format (always):
/// {
///   "success": false,
///   "message": "Human-readable error description",
///   "errorCode": "MACHINE_READABLE_CODE",
///   "data": null,
///   "traceId": "00-..."
/// }
/// 
/// Exception → HTTP Status mapping:
///   NotFoundException         → 404
///   DomainValidationException → 422
///   ForbiddenException        → 403
///   ConflictException         → 409
///   UnauthorizedAccessException → 401
///   InvalidOperationException → 400
///   DomainException (base)    → 400
///   Everything else           → 500
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = context.TraceIdentifier;
        var (statusCode, errorCode, message) = MapException(exception);

        // ── Structured Logging ──────────────────────────────────────────
        // Serilog captures these structured properties for searchability:
        // - TraceId for correlating with distributed traces
        // - ErrorCode for filtering by error type
        // - StatusCode for monitoring HTTP error rates
        _logger.LogError(exception,
            "Unhandled exception caught. TraceId={TraceId} ErrorCode={ErrorCode} StatusCode={StatusCode} Path={Path}",
            traceId, errorCode, statusCode, context.Request.Path);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var response = ApiErrorResponse.Create(message, errorCode, traceId);

        // Attach validation errors if applicable
        if (exception is DomainValidationException validationEx && validationEx.Errors.Count > 0)
        {
            response.Errors = validationEx.Errors;
        }

        // In development, include the raw exception details for debugging
        if (_env.IsDevelopment() && exception is not DomainException)
        {
            response.Data = new
            {
                exceptionType = exception.GetType().Name,
                stackTrace = exception.StackTrace,
                innerException = exception.InnerException?.Message
            };
        }

        var json = JsonSerializer.Serialize(response, JsonOptions);
        await context.Response.WriteAsync(json);
    }

    /// <summary>
    /// Maps exception types to (StatusCode, ErrorCode, Message) tuples.
    /// Domain exceptions preserve their error codes and messages.
    /// System exceptions get generic messages for security (no info leakage).
    /// </summary>
    private static (int StatusCode, string ErrorCode, string Message) MapException(Exception exception)
    {
        return exception switch
        {
            NotFoundException ex => ((int)HttpStatusCode.NotFound, ex.ErrorCode, ex.Message),

            DomainValidationException ex => ((int)HttpStatusCode.UnprocessableEntity, ex.ErrorCode, ex.Message),

            ForbiddenException ex => ((int)HttpStatusCode.Forbidden, ex.ErrorCode, ex.Message),

            ConflictException ex => ((int)HttpStatusCode.Conflict, ex.ErrorCode, ex.Message),

            DomainException ex => ((int)HttpStatusCode.BadRequest, ex.ErrorCode, ex.Message),

            UnauthorizedAccessException => ((int)HttpStatusCode.Unauthorized, "UNAUTHORIZED",
                "Access denied. Please authenticate."),

            InvalidOperationException ex => ((int)HttpStatusCode.BadRequest, "BAD_REQUEST", ex.Message),

            OperationCanceledException => (499, "REQUEST_CANCELLED", "The request was cancelled by the client."),

            _ => ((int)HttpStatusCode.InternalServerError, "INTERNAL_ERROR",
                "An unexpected error occurred. Please try again later.")
        };
    }
}

/// <summary>
/// Extension method for clean middleware registration in Program.cs.
/// Usage: app.UseExceptionMiddleware();
/// </summary>
public static class ExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseExceptionMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ExceptionMiddleware>();
    }
}

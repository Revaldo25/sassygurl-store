using System.Net;
using System.Text.Json;
using SassyGurl.Api.DTOs.Common;

namespace SassyGurl.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred.");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        var traceId = context.TraceIdentifier;
        var isDevelopment = context.RequestServices.GetRequiredService<IHostEnvironment>().IsDevelopment();
        
        var response = ApiResponse<object>.Fail("Terjadi kesalahan server internal.");

        switch (exception)
        {
            case UnauthorizedAccessException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Message = "Akses ditolak. Silakan login kembali.";
                break;
            case KeyNotFoundException:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = "Data tidak ditemukan.";
                break;
            case InvalidOperationException e:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = e.Message;
                break;
            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                if (isDevelopment)
                {
                    response.Errors = new List<string> { exception.Message, $"TraceId: {traceId}" };
                }
                else
                {
                    response.Errors = new List<string> { $"TraceId: {traceId}" };
                }
                break;
        }

        var result = JsonSerializer.Serialize(response, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        return context.Response.WriteAsync(result);
    }
}

// Extension method for easy registration
public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<GlobalExceptionMiddleware>();
    }
}

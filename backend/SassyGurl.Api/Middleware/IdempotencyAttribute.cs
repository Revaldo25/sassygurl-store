namespace SassyGurl.Api.Middleware;

/// <summary>
/// Attribute to mark controller actions that require idempotency protection.
/// Apply to any POST/PUT/PATCH endpoint that performs state-changing operations
/// (e.g., creating transactions, processing payments).
/// 
/// When applied, the IdempotencyMiddleware will:
/// 1. Require the X-Idempotency-Key header (UUID format).
/// 2. Check Redis for existing responses under that key.
/// 3. If found, return the cached response (HTTP 409 or original response).
/// 4. If not found, acquire a distributed lock, process the request,
///    and cache the response for 24 hours.
/// 
/// Usage:
///   [HttpPost]
///   [Idempotency]
///   public async Task&lt;IActionResult&gt; CreateTransaction(...)
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public class IdempotencyAttribute : Attribute
{
    /// <summary>
    /// Optional custom header name override. Defaults to "X-Idempotency-Key".
    /// </summary>
    public string HeaderName { get; set; } = "X-Idempotency-Key";
}

namespace SassyGurl.Domain.Entities;

/// <summary>
/// Represents a cached idempotency record stored in Redis.
/// Contains the original response so that duplicate requests
/// receive the exact same response without re-processing.
/// </summary>
public class IdempotencyRecord
{
    /// <summary>
    /// The idempotency key (UUID) from X-Idempotency-Key header.
    /// </summary>
    public string Key { get; set; } = null!;

    /// <summary>
    /// HTTP status code of the original response.
    /// </summary>
    public int StatusCode { get; set; }

    /// <summary>
    /// Serialized response body from the original request.
    /// </summary>
    public string? ResponseBody { get; set; }

    /// <summary>
    /// Content-Type header value of the original response.
    /// </summary>
    public string? ContentType { get; set; }

    /// <summary>
    /// UTC timestamp when this record was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

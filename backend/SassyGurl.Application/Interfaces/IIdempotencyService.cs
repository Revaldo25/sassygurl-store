using SassyGurl.Domain.Entities;

namespace SassyGurl.Application.Interfaces;

/// <summary>
/// Contract for Redis-backed idempotency key storage.
/// Implementations handle key existence checks, response caching,
/// and TTL management (24-hour expiry).
/// </summary>
public interface IIdempotencyService
{
    /// <summary>
    /// Checks if an idempotency key has already been processed.
    /// </summary>
    /// <param name="key">The UUID from the X-Idempotency-Key header.</param>
    /// <returns>True if the key exists in Redis (already processed).</returns>
    Task<bool> ExistsAsync(string key);

    /// <summary>
    /// Retrieves the cached response for a previously processed idempotency key.
    /// </summary>
    /// <param name="key">The UUID idempotency key.</param>
    /// <returns>The cached IdempotencyRecord or null if not found.</returns>
    Task<IdempotencyRecord?> GetAsync(string key);

    /// <summary>
    /// Stores the response for an idempotency key with 24-hour TTL.
    /// </summary>
    /// <param name="record">The record containing response data.</param>
    Task SaveAsync(IdempotencyRecord record);
}

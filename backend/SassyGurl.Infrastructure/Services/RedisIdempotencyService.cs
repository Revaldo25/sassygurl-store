using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using SassyGurl.Application.Interfaces;
using SassyGurl.Domain.Entities;

namespace SassyGurl.Infrastructure.Services;

/// <summary>
/// Redis-backed implementation of IIdempotencyService.
/// 
/// Design decisions:
/// - Uses IDistributedCache (StackExchange.Redis) for portability.
/// - 24-hour absolute TTL ensures keys auto-expire.
/// - JSON serialization for the response body enables cross-node compatibility.
/// - Gracefully degrades on Redis failures (logs warning, allows request through).
/// </summary>
public class RedisIdempotencyService : IIdempotencyService
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<RedisIdempotencyService> _logger;

    // All idempotency keys are prefixed to avoid Redis namespace collisions
    private const string KeyPrefix = "idempotency:";

    // Keys expire after 24 hours as specified in the requirements
    private static readonly DistributedCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
    };

    public RedisIdempotencyService(
        IDistributedCache cache,
        ILogger<RedisIdempotencyService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<bool> ExistsAsync(string key)
    {
        try
        {
            var data = await _cache.GetStringAsync($"{KeyPrefix}{key}");
            return data is not null;
        }
        catch (Exception ex)
        {
            // Graceful degradation: if Redis is down, allow the request through
            // rather than blocking all operations
            _logger.LogWarning(ex, "Redis idempotency check failed for key {Key}. Allowing request through.", key);
            return false;
        }
    }

    public async Task<IdempotencyRecord?> GetAsync(string key)
    {
        try
        {
            var data = await _cache.GetStringAsync($"{KeyPrefix}{key}");
            if (data is null) return null;

            return JsonSerializer.Deserialize<IdempotencyRecord>(data);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis idempotency get failed for key {Key}.", key);
            return null;
        }
    }

    public async Task SaveAsync(IdempotencyRecord record)
    {
        try
        {
            var serialized = JsonSerializer.Serialize(record);
            await _cache.SetStringAsync($"{KeyPrefix}{record.Key}", serialized, CacheOptions);

            _logger.LogDebug("Idempotency key {Key} cached with 24h TTL.", record.Key);
        }
        catch (Exception ex)
        {
            // Non-critical failure: the worst case is the next identical request
            // gets processed again (acceptable trade-off vs. blocking the response)
            _logger.LogWarning(ex, "Failed to cache idempotency key {Key}.", record.Key);
        }
    }
}

using Microsoft.Extensions.Logging;
using RedLockNet;
using RedLockNet.SERedis;
using SassyGurl.Application.Interfaces;

namespace SassyGurl.Infrastructure.Services;

/// <summary>
/// Distributed locking service using RedLock.net (Redlock algorithm).
/// 
/// The Redlock algorithm ensures mutual exclusion across multiple Redis nodes,
/// providing safety even during network partitions. This is critical for the
/// idempotency system to prevent race conditions when two identical requests
/// arrive simultaneously at different API nodes.
/// 
/// Lock lifecycle:
/// 1. Acquire lock on "idempotency:{key}" resource
/// 2. Process the request
/// 3. Store the response in Redis
/// 4. Release the lock via IAsyncDisposable
/// </summary>
public class RedLockDistributedLockService : IDistributedLockService
{
    private readonly IDistributedLockFactory _lockFactory;
    private readonly ILogger<RedLockDistributedLockService> _logger;

    public RedLockDistributedLockService(
        IDistributedLockFactory lockFactory,
        ILogger<RedLockDistributedLockService> logger)
    {
        _lockFactory = lockFactory;
        _logger = logger;
    }

    public async Task<IAsyncDisposable?> AcquireLockAsync(string resource, TimeSpan expiryTime)
    {
        try
        {
            // Wait up to 5 seconds to acquire the lock, retrying every 200ms.
            // This handles the scenario where another node is currently processing
            // the same idempotency key.
            var redLock = await _lockFactory.CreateLockAsync(
                resource: resource,
                expiryTime: expiryTime,
                waitTime: TimeSpan.FromSeconds(5),
                retryTime: TimeSpan.FromMilliseconds(200));

            if (redLock.IsAcquired)
            {
                _logger.LogDebug("Distributed lock acquired for resource {Resource}.", resource);
                return new RedLockHandle(redLock, _logger);
            }

            _logger.LogWarning(
                "Failed to acquire distributed lock for resource {Resource} after 5s wait.",
                resource);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error acquiring distributed lock for resource {Resource}.", resource);
            return null;
        }
    }

    /// <summary>
    /// Wraps IRedLock in IAsyncDisposable for deterministic release.
    /// </summary>
    private sealed class RedLockHandle : IAsyncDisposable
    {
        private readonly IRedLock _redLock;
        private readonly ILogger _logger;

        public RedLockHandle(IRedLock redLock, ILogger logger)
        {
            _redLock = redLock;
            _logger = logger;
        }

        public ValueTask DisposeAsync()
        {
            _logger.LogDebug("Releasing distributed lock for resource {Resource}.", _redLock.Resource);
            _redLock.Dispose();
            return ValueTask.CompletedTask;
        }
    }
}

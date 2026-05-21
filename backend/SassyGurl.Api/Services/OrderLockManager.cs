using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using SassyGurl.Application.Interfaces;

namespace SassyGurl.Api.Services;

/// <summary>
/// Manages per-order asynchronous locks to prevent race conditions during webhooks.
/// Integrates with the Redis-backed IDistributedLockService for production multi-instance safety.
/// Master Plan §8: Concurrency control.
/// </summary>
public interface IOrderLockManager
{
    Task<IDisposable> AcquireLockAsync(string orderId, TimeSpan timeout);
}

public class OrderLockManager : IOrderLockManager
{
    private readonly IDistributedLockService? _distributedLockService;
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
    private readonly ILogger<OrderLockManager> _logger;

    public OrderLockManager(ILogger<OrderLockManager> logger, IDistributedLockService? distributedLockService = null)
    {
        _logger = logger;
        _distributedLockService = distributedLockService;
    }

    public async Task<IDisposable> AcquireLockAsync(string orderId, TimeSpan timeout)
    {
        if (_distributedLockService is not null)
        {
            _logger.LogInformation("Acquiring distributed lock for order {OrderId} using RedLock...", orderId);
            var lockResource = $"order-lock:{orderId}";
            var distributedLock = await _distributedLockService.AcquireLockAsync(lockResource, timeout);
            if (distributedLock is not null)
            {
                return new DistributedReleaser(distributedLock, orderId, _logger);
            }
            _logger.LogWarning("Failed to acquire distributed lock for order {OrderId}. Falling back to in-memory lock.", orderId);
        }

        var semaphore = _locks.GetOrAdd(orderId, _ => new SemaphoreSlim(1, 1));
        
        if (!await semaphore.WaitAsync(timeout))
        {
            _logger.LogWarning("Timeout waiting to acquire lock for order {OrderId}", orderId);
            throw new TimeoutException($"Could not acquire lock for order {orderId}");
        }

        return new Releaser(semaphore, orderId, _locks);
    }

    private sealed class Releaser : IDisposable
    {
        private readonly SemaphoreSlim _semaphore;
        private readonly string _orderId;
        private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks;

        public Releaser(SemaphoreSlim semaphore, string orderId, ConcurrentDictionary<string, SemaphoreSlim> locks)
        {
            _semaphore = semaphore;
            _orderId = orderId;
            _locks = locks;
        }

        public void Dispose()
        {
            _semaphore.Release();
        }
    }

    private sealed class DistributedReleaser : IDisposable
    {
        private readonly IAsyncDisposable _lockHandle;
        private readonly string _orderId;
        private readonly ILogger _logger;

        public DistributedReleaser(IAsyncDisposable lockHandle, string orderId, ILogger logger)
        {
            _lockHandle = lockHandle;
            _orderId = orderId;
            _logger = logger;
        }

        public void Dispose()
        {
            _logger.LogDebug("Releasing distributed lock for order {OrderId}.", _orderId);
            _lockHandle.DisposeAsync().AsTask().GetAwaiter().GetResult();
        }
    }
}

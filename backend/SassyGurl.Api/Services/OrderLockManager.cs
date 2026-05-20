using System.Collections.Concurrent;

namespace SassyGurl.Api.Services;

/// <summary>
/// Manages per-order asynchronous locks to prevent race conditions during webhooks.
/// In a multi-instance enterprise deployment, this should be replaced by a Redis distributed lock (RedLock).
/// Master Plan §8: Concurrency control.
/// </summary>
public interface IOrderLockManager
{
    Task<IDisposable> AcquireLockAsync(string orderId, TimeSpan timeout);
}

public class OrderLockManager : IOrderLockManager
{
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
    private readonly ILogger<OrderLockManager> _logger;

    public OrderLockManager(ILogger<OrderLockManager> logger)
    {
        _logger = logger;
    }

    public async Task<IDisposable> AcquireLockAsync(string orderId, TimeSpan timeout)
    {
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
            // We could optionally clean up empty semaphores, but for now we keep them to avoid race conditions on removal.
        }
    }
}

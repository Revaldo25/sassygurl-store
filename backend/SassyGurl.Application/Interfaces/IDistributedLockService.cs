namespace SassyGurl.Application.Interfaces;

/// <summary>
/// Contract for distributed locking using RedLock.net.
/// Provides thread-safe/node-safe locking for concurrent request protection.
/// Used by the IdempotencyMiddleware to prevent race conditions
/// on simultaneous identical requests.
/// </summary>
public interface IDistributedLockService
{
    /// <summary>
    /// Acquires a distributed lock for the given resource.
    /// </summary>
    /// <param name="resource">The resource identifier to lock (e.g., "idempotency:{key}").</param>
    /// <param name="expiryTime">How long the lock is held before auto-release.</param>
    /// <returns>A disposable lock handle. Null if lock acquisition failed.</returns>
    Task<IAsyncDisposable?> AcquireLockAsync(string resource, TimeSpan expiryTime);
}

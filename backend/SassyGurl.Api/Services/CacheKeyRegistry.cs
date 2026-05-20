using System.Collections.Concurrent;

namespace SassyGurl.Api.Services;

/// <summary>
/// Tracks dynamic cache keys (like catalog:game:{slug}:{role}) so they can be 
/// batch-invalidated during provider syncs.
/// Master Plan §7: Caching & Optimization.
/// </summary>
public interface ICacheKeyRegistry
{
    void AddGameCacheKey(string key);
    IEnumerable<string> GetAllGameCacheKeys();
    void ClearGameCacheKeys();
}

public class CacheKeyRegistry : ICacheKeyRegistry
{
    private readonly ConcurrentDictionary<string, byte> _gameKeys = new();

    public void AddGameCacheKey(string key)
    {
        _gameKeys.TryAdd(key, 0);
    }

    public IEnumerable<string> GetAllGameCacheKeys()
    {
        return _gameKeys.Keys.ToList();
    }

    public void ClearGameCacheKeys()
    {
        _gameKeys.Clear();
    }
}

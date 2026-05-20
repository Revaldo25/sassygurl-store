using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SassyGurl.Api.Services;
using Xunit;
using System.Reflection;

namespace SassyGurl.Tests;

public class CatalogCacheTests
{
    [Fact]
    public void InvalidateCatalogCache_ClearsDynamicKeys()
    {
        // Arrange
        var cache = new MemoryCache(new MemoryCacheOptions());
        var registry = new CacheKeyRegistry();
        
        var mockFactory = new Mock<IHttpClientFactory>();
        var mockDb = new Mock<SassyGurl.Api.Data.SassyGurlDbContext>();
        var mockConfig = new Mock<IConfiguration>();
        var mockCloudinary = new Mock<ICloudinaryService>();

        var syncEngine = new SyncEngine(
            mockFactory.Object,
            null!, // bypassing db mock since we use reflection
            mockConfig.Object,
            mockCloudinary.Object,
            new NullLogger<SyncEngine>(),
            cache,
            registry
        );

        // Simulate catalog service setting a dynamic cache key
        string dynamicKey = "catalog:game:mobile-legends:MEMBER";
        cache.Set(dynamicKey, "SomeData");
        registry.AddGameCacheKey(dynamicKey);

        // Act
        // Invoke private method via reflection to test invalidation logic
        var method = typeof(SyncEngine).GetMethod("InvalidateCatalogCache", BindingFlags.NonPublic | BindingFlags.Instance);
        method!.Invoke(syncEngine, null);

        // Assert
        Assert.False(cache.TryGetValue(dynamicKey, out _));
        Assert.Empty(registry.GetAllGameCacheKeys());
    }
}

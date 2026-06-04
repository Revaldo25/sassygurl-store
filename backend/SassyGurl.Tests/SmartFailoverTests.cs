using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Moq.Protected;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;
using SassyGurl.Api.Services;
using SassyGurl.Api.Services.Providers;
using Xunit;

namespace SassyGurl.Tests;

public class SmartFailoverTests
{
    private readonly SassyGurlDbContext _db;
    private readonly ServiceProvider _serviceProvider;
    private readonly Mock<HttpMessageHandler> _mockDigiflazzHttp;
    private readonly Mock<HttpMessageHandler> _mockVipHttp;
    
    public SmartFailoverTests()
    {
        var options = new DbContextOptionsBuilder<SassyGurlDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
            
        _db = new SassyGurlDbContext(options);
        
        _mockDigiflazzHttp = new Mock<HttpMessageHandler>();
        _mockVipHttp = new Mock<HttpMessageHandler>();

        var mockHttpClientFactory = new Mock<IHttpClientFactory>();
        mockHttpClientFactory.Setup(x => x.CreateClient("DigiflazzClient"))
            .Returns(new HttpClient(_mockDigiflazzHttp.Object) { BaseAddress = new Uri("http://digi.test/") });
        mockHttpClientFactory.Setup(x => x.CreateClient("VipResellerClient"))
            .Returns(new HttpClient(_mockVipHttp.Object) { BaseAddress = new Uri("http://vip.test/") });

        var inMemoryConfig = new Dictionary<string, string>
        {
            {"Features:EnableSmartFailover", "true"},
            {"Digiflazz:Username", "testuser"},
            {"Digiflazz:ApiKey", "testkey"},
            {"VipReseller:ApiId", "testvipid"},
            {"VipReseller:ApiKey", "testvipkey"}
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddSingleton<IHttpClientFactory>(mockHttpClientFactory.Object);
        services.AddMemoryCache();
        services.AddSingleton<Microsoft.Extensions.Logging.ILogger<DigiflazzAdapter>>(NullLogger<DigiflazzAdapter>.Instance);
        services.AddSingleton<Microsoft.Extensions.Logging.ILogger<VipResellerAdapter>>(NullLogger<VipResellerAdapter>.Instance);
        services.AddSingleton<Microsoft.Extensions.Logging.ILogger<ProviderService>>(NullLogger<ProviderService>.Instance);
        
        services.AddScoped<SassyGurlDbContext>(_ => _db);
        services.AddScoped<DigiflazzAdapter>();
        services.AddScoped<VipResellerAdapter>();
        services.AddScoped<IProviderService, ProviderService>();
        
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task SmartFailover_ShouldUseDigiflazz_WhenSuccessful()
    {
        // Arrange
        var product = new Product
        {
            Id = Guid.NewGuid().ToString(),
            Sku = "DEFAULT-SKU",
            GameId = "G1", ProviderId = "P1", Name = "Test Product",
            Metadata = "{\"providerMappings\": {\"Digiflazz\": {\"sku\": \"DIGI-100\"}, \"VIP Reseller\": {\"sku\": \"VIP-100\"}}}"
        };
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        // Mock Digiflazz Balance Check -> > 1000
        _mockDigiflazzHttp.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.Is<HttpRequestMessage>(req => req.RequestUri.ToString().Contains("cek-saldo")), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"data\": {\"deposit\": 50000}}") });

        // Mock Digiflazz Order -> Sukses
        _mockDigiflazzHttp.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.Is<HttpRequestMessage>(req => req.RequestUri.ToString().Contains("transaction")), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"data\": {\"status\": \"Sukses\", \"message\": \"OK\", \"sn\": \"12345\"}}") });

        var sut = _serviceProvider.GetRequiredService<IProviderService>();

        // Act
        var result = await sut.PlaceOrderAsync("DEFAULT-SKU", "target123", "", "ref123", product.Id);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("Digiflazz", result.ProviderName);
        Assert.Equal("12345", result.Sn);
        
        // Ensure VIP was never called
        _mockVipHttp.Protected().Verify("SendAsync", Times.Never(), ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>());
    }

    [Fact]
    public async Task SmartFailover_ShouldFallbackToVip_WhenDigiflazzFails()
    {
        // Arrange
        var product = new Product
        {
            Id = Guid.NewGuid().ToString(),
            Sku = "DEFAULT-SKU",
            GameId = "G1", ProviderId = "P1", Name = "Test Product",
            Metadata = "{\"providerMappings\": {\"Digiflazz\": {\"sku\": \"DIGI-100\"}, \"VIP Reseller\": {\"sku\": \"VIP-100\"}}}"
        };
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        // Mock Digiflazz Balance Check -> > 1000
        _mockDigiflazzHttp.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.Is<HttpRequestMessage>(req => req.RequestUri.ToString().Contains("cek-saldo")), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"data\": {\"deposit\": 50000}}") });

        // Mock Digiflazz Order -> Gagal
        _mockDigiflazzHttp.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.Is<HttpRequestMessage>(req => req.RequestUri.ToString().Contains("transaction")), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"data\": {\"status\": \"Gagal\", \"message\": \"Gangguan\"}}") });

        // Mock VIP Reseller Order -> Sukses
        _mockVipHttp.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.Is<HttpRequestMessage>(req => req.RequestUri.ToString().Contains("game-feature")), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"result\": true, \"data\": {\"trxid\": \"vip-ref-123\", \"sn\": \"VIP-54321\"}}") });

        var sut = _serviceProvider.GetRequiredService<IProviderService>();

        // Act
        var result = await sut.PlaceOrderAsync("DEFAULT-SKU", "target123", "", "ref123", product.Id);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("VIP Reseller", result.ProviderName);
        Assert.Equal("VIP-54321", result.Sn);
        
        // Ensure VIP was called
        _mockVipHttp.Protected().Verify("SendAsync", Times.Once(), ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>());
    }

    [Fact]
    public async Task SmartFailover_RollbackMode_ShouldUseLegacyPath()
    {
        // Arrange
        // Force rollback mode
        var config = _serviceProvider.GetRequiredService<IConfiguration>() as IConfigurationRoot;
        config.Providers.ToList().ForEach(p => {
            if (p.TryGet("Features:EnableSmartFailover", out _)) p.Set("Features:EnableSmartFailover", "false");
        });

        // Mock Digiflazz Balance Check
        _mockDigiflazzHttp.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.Is<HttpRequestMessage>(req => req.RequestUri.ToString().Contains("cek-saldo")), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"data\": {\"deposit\": 50000}}") });

        // Mock Digiflazz Order -> Sukses
        _mockDigiflazzHttp.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.Is<HttpRequestMessage>(req => req.RequestUri.ToString().Contains("transaction")), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("{\"data\": {\"status\": \"Sukses\", \"message\": \"OK\", \"sn\": \"LEGACY-SN\"}}") });

        var sut = _serviceProvider.GetRequiredService<IProviderService>();

        // Act
        var result = await sut.PlaceOrderAsync("RAW-SKU", "target123", "", "ref123", null);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("Digiflazz", result.ProviderName);
        Assert.Equal("LEGACY-SN", result.Sn);
    }
}

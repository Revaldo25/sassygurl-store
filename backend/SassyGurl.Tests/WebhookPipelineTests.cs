using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SassyGurl.Api.Controllers;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;
using SassyGurl.Api.Services;
using SassyGurl.Application.Interfaces;
using Xunit;

namespace SassyGurl.Tests;

public class WebhookPipelineTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public WebhookPipelineTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClientWithOverrides(
        Action<IServiceCollection> configureServices, 
        Dictionary<string, string?> configurationOverrides)
    {
        var customFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((context, configBuilder) =>
            {
                configBuilder.AddInMemoryCollection(configurationOverrides);
            });

            builder.ConfigureTestServices(services =>
            {
                // Remove existing DbContext configurations
                var optionsDescriptors = services.Where(d => d.ServiceType.Name.Contains("DbContextOptions")).ToList();
                foreach (var d in optionsDescriptors) services.Remove(d);
                
                var dbConnectionDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(System.Data.Common.DbConnection));
                if (dbConnectionDescriptor != null) services.Remove(dbConnectionDescriptor);
                
                var dbName = "WebhookTestDb_" + Guid.NewGuid().ToString();
                services.AddDbContext<SassyGurlDbContext>(options =>
                {
                    options.UseInMemoryDatabase(dbName)
                           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning));
                });

                var mockLockService = new Mock<SassyGurl.Application.Interfaces.IDistributedLockService>();
                mockLockService.Setup(l => l.AcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>()))
                               .ReturnsAsync(new Mock<IAsyncDisposable>().Object);
                services.AddSingleton(mockLockService.Object);

                var mockIdempotency = new Mock<SassyGurl.Application.Interfaces.IIdempotencyService>();
                mockIdempotency.Setup(i => i.ExistsAsync(It.IsAny<string>())).ReturnsAsync(false);
                mockIdempotency.Setup(i => i.GetAsync(It.IsAny<string>())).ReturnsAsync((SassyGurl.Domain.Entities.IdempotencyRecord?)null);
                mockIdempotency.Setup(i => i.SaveAsync(It.IsAny<SassyGurl.Domain.Entities.IdempotencyRecord>())).Returns(Task.CompletedTask);
                services.AddSingleton(mockIdempotency.Object);

                configureServices(services);
            });
        });

        return customFactory.CreateClient();
    }

    [Fact]
    public async Task Webhook_WithoutCallbackToken_ReturnsForbidden()
    {
        // Arrange
        var client = CreateClientWithOverrides(services => {}, new Dictionary<string, string?>
        {
            {"WebhookSecurity:EnforceIpWhitelist", "false"} // Disable IP check to focus on token
        });

        var payload = new XenditInvoicePayload { Id = "inv_123", ExternalId = "ext_123", Status = "PAID", Amount = 10000 };
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/webhooks/xendit/invoice");
        request.Content = JsonContent.Create(payload);
        request.Headers.Add("X-Idempotency-Key", Guid.NewGuid().ToString());

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Missing callback token", content);
    }

    [Fact]
    public async Task Webhook_WithInvalidCallbackToken_ReturnsForbidden()
    {
        // Arrange
        var client = CreateClientWithOverrides(services => {}, new Dictionary<string, string?>
        {
            {"Xendit:WebhookToken", "secret-token"},
            {"WebhookSecurity:EnforceIpWhitelist", "false"}
        });

        var payload = new XenditInvoicePayload { Id = "inv_123", ExternalId = "ext_123", Status = "PAID", Amount = 10000 };
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/webhooks/xendit/invoice");
        request.Content = JsonContent.Create(payload);
        request.Headers.Add("x-callback-token", "wrong-token");
        request.Headers.Add("X-Idempotency-Key", Guid.NewGuid().ToString());

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Webhook_WithValidToken_ProcessesSuccessfully()
    {
        // Arrange
        var mockProvider = new Mock<IProviderService>();
        mockProvider.Setup(p => p.PlaceOrderAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new ProviderOrderResponse { IsSuccess = true, Sn = "123", ProviderRef = "abc", ProviderName = "Mock" });

        var mockValidation = new Mock<IPaymentValidationService>();
        mockValidation.Setup(v => v.ValidatePaymentAsync(It.IsAny<string>(), It.IsAny<decimal>())).ReturnsAsync(true);

        var mockNotifier = new Mock<INotificationOrchestrator>();

        var configurationOverrides = new Dictionary<string, string?>
        {
            {"Xendit:WebhookToken", "secret-token"},
            {"WebhookSecurity:EnforceIpWhitelist", "false"}
        };

        var customFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((context, configBuilder) =>
            {
                configBuilder.AddInMemoryCollection(configurationOverrides);
            });

            builder.ConfigureTestServices(services =>
            {
                var optionsDescriptors = services.Where(d => d.ServiceType.Name.Contains("DbContextOptions")).ToList();
                foreach (var d in optionsDescriptors) services.Remove(d);

                var dbConnectionDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(System.Data.Common.DbConnection));
                if (dbConnectionDescriptor != null) services.Remove(dbConnectionDescriptor);
                
                var dbName = "WebhookTestDb_" + Guid.NewGuid().ToString();
                services.AddDbContext<SassyGurlDbContext>(options =>
                {
                    options.UseInMemoryDatabase(dbName)
                           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning));
                });

                services.AddScoped(sp => mockProvider.Object);
                services.AddScoped(sp => mockValidation.Object);
                var mockLockService = new Mock<SassyGurl.Application.Interfaces.IDistributedLockService>();
                mockLockService.Setup(l => l.AcquireLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>()))
                               .ReturnsAsync(new Mock<IAsyncDisposable>().Object);
                services.AddSingleton(mockLockService.Object);

                var mockIdempotency = new Mock<SassyGurl.Application.Interfaces.IIdempotencyService>();
                mockIdempotency.Setup(i => i.ExistsAsync(It.IsAny<string>())).ReturnsAsync(false);
                mockIdempotency.Setup(i => i.GetAsync(It.IsAny<string>())).ReturnsAsync((SassyGurl.Domain.Entities.IdempotencyRecord?)null);
                mockIdempotency.Setup(i => i.SaveAsync(It.IsAny<SassyGurl.Domain.Entities.IdempotencyRecord>())).Returns(Task.CompletedTask);
                services.AddSingleton(mockIdempotency.Object);

                services.AddScoped(sp => mockNotifier.Object);
            });
        });

        // Seed DB with test transaction
        string testExtId = "INV-TEST-123";
        using (var scope = customFactory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SassyGurlDbContext>();
            var game = new Game { Id = Guid.NewGuid().ToString(), Name = "Test Game", Slug = "test-game", CategoryId = "test" };
            var product = new Product { Id = Guid.NewGuid().ToString(), Name = "Test Product", Sku = "SKU123", GameId = game.Id, ProviderId = "1" };
            var payment = new PaymentMethod { Id = Guid.NewGuid().ToString(), Name = "VA", Code = "VA" };
            
            db.Games.Add(game);
            db.Products.Add(product);
            db.PaymentMethods.Add(payment);

            var tx = new Transaction
            {
                Id = Guid.NewGuid().ToString(),
                InvoiceId = testExtId,
                OrderStatus = OrderStatus.PENDING,
                PaymentStatus = PaymentStatus.UNPAID,
                TotalAmount = 10000,
                Sku = "SKU123",
                TargetId = "TARGET",
                DenomName = "Test Denom",
                GameId = game.Id,
                ProductId = product.Id,
                PaymentId = payment.Id
            };
            db.Transactions.Add(tx);
            db.SaveChanges();
        }

        var client = customFactory.CreateClient();

        var payload = new XenditInvoicePayload { Id = "inv_123", ExternalId = testExtId, Status = "PAID", Amount = 10000 };
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/webhooks/xendit/invoice");
        request.Content = JsonContent.Create(payload);
        request.Headers.Add("x-callback-token", "secret-token");
        request.Headers.Add("X-Idempotency-Key", Guid.NewGuid().ToString());

        // Act
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verify DB updates
        using (var scope = customFactory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SassyGurlDbContext>();
            var tx = db.Transactions.First(t => t.InvoiceId == testExtId);
            
            Assert.Equal(PaymentStatus.PAID, tx.PaymentStatus);
            Assert.Equal(OrderStatus.SUCCESS, tx.OrderStatus);
            Assert.NotNull(tx.ProviderRef);
            
            mockProvider.Verify(p => p.PlaceOrderAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }
    }
}

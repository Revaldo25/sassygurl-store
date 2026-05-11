using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RedLockNet;
using RedLockNet.SERedis;
using RedLockNet.SERedis.Configuration;
using StackExchange.Redis;
using SassyGurl.Application.Interfaces;
using SassyGurl.Infrastructure.Interceptors;
using SassyGurl.Infrastructure.Services;

namespace SassyGurl.Infrastructure;

/// <summary>
/// Dependency Injection registration for all Infrastructure-layer services.
/// Called from the WebAPI layer's Program.cs to wire up Redis, RedLock, 
/// Idempotency, and EF Core Interceptors.
/// 
/// This follows the Clean Architecture principle of having each layer
/// expose its own DI registration method, keeping Program.cs clean.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ─── Redis Connection ────────────────────────────────────────────
        // Uses StackExchange.Redis ConnectionMultiplexer as a singleton.
        // This is the recommended pattern — multiplexers are thread-safe
        // and expensive to create.
        var redisConnectionString = configuration.GetConnectionString("Redis")
                                    ?? "localhost:6379";

        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var logger = sp.GetRequiredService<ILogger<RedisIdempotencyService>>();
            try
            {
                var options = ConfigurationOptions.Parse(redisConnectionString);
                options.AbortOnConnectFail = false; // Allow connection retries
                options.ConnectRetry = 3;
                options.ConnectTimeout = 5000;
                return ConnectionMultiplexer.Connect(options);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to connect to Redis at {ConnectionString}. Idempotency and caching will be degraded.", redisConnectionString);
                throw;
            }
        });

        // ─── Distributed Cache (IDistributedCache → Redis) ──────────────
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
            options.InstanceName = "SassyGurl:";
        });

        // ─── RedLock.net Distributed Lock Factory ────────────────────────
        // RedLockFactory requires a list of Redis endpoints.
        // For single-node development, one endpoint is sufficient.
        // For production, supply multiple Redis sentinel/cluster nodes.
        services.AddSingleton<IDistributedLockFactory>(sp =>
        {
            var multiplexer = sp.GetRequiredService<IConnectionMultiplexer>();
            return RedLockFactory.Create(new List<RedLockMultiplexer>
            {
                new(multiplexer as ConnectionMultiplexer
                    ?? throw new InvalidOperationException("ConnectionMultiplexer cast failed"))
            });
        });

        // ─── Application Services ───────────────────────────────────────
        services.AddScoped<IIdempotencyService, RedisIdempotencyService>();
        services.AddScoped<IDistributedLockService, RedLockDistributedLockService>();

        // ─── EF Core Interceptors ───────────────────────────────────────
        // Registered as singletons because interceptors are stateless
        // (they receive DbContext via method parameters, not constructor).
        services.AddSingleton<TransactionAuditInterceptor>();

        // ─── Phase 2 Services (Financial Fortress) ───────────────────────
        services.AddSingleton<IEncryptionService, AesGcmEncryptionService>();
        services.AddScoped<IPaymentValidationService, XenditPaymentValidationService>();

        // Register the LogMaskingHandler
        services.AddTransient<SassyGurl.Infrastructure.HttpHandlers.LogMaskingHandler>();

        // Resilient External API Client for Xendit (Polly + Log Masking)
        services.AddHttpClient("XenditClient", client =>
        {
            var baseUrl = configuration["Xendit:BaseUrl"] ?? "https://api.xendit.co/";
            client.BaseAddress = new Uri(baseUrl);

            var apiKey = configuration["Xendit:SecretApiKey"];
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                // Xendit uses Basic Auth for Secret API Keys (API_KEY + ":" -> Base64)
                var encodedKey = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes($"{apiKey}:"));
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", encodedKey);
            }
        })
        .AddHttpMessageHandler<SassyGurl.Infrastructure.HttpHandlers.LogMaskingHandler>()
        .AddStandardResilienceHandler(); // Polly default resilient strategy (.NET 8+)

        // ─── Phase 3 Services (Supply Chain) ─────────────────────────────
        services.AddHttpClient("DigiflazzClient", client =>
        {
            var baseUrl = configuration["ProviderApis:DigiflazzBaseUrl"] ?? "https://api.digiflazz.com/v1/";
            client.BaseAddress = new Uri(baseUrl);
        })
        .AddHttpMessageHandler<SassyGurl.Infrastructure.HttpHandlers.LogMaskingHandler>()
        .AddStandardResilienceHandler();

        services.AddHttpClient("VipResellerClient", client =>
        {
            var baseUrl = configuration["ProviderApis:VipResellerBaseUrl"] ?? "https://vipreseller.co.id/api/";
            client.BaseAddress = new Uri(baseUrl);
        })
        .AddHttpMessageHandler<SassyGurl.Infrastructure.HttpHandlers.LogMaskingHandler>()
        .AddStandardResilienceHandler();

        // Register Providers
        services.AddScoped<IProviderApiService, DigiflazzApiService>();
        services.AddScoped<IProviderApiService, VipResellerApiService>();

        // Register Queue system
        services.AddSingleton<IOrderFulfillmentQueue, SassyGurl.Application.Interfaces.OrderFulfillmentQueue>();

        // Register Background Service for Order Fulfillment Queue
        services.AddHostedService<SassyGurl.Infrastructure.BackgroundServices.OrderFulfillmentBackgroundService>();

        return services;
    }
}

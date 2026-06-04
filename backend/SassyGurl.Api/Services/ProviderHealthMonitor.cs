using Microsoft.AspNetCore.SignalR;
using SassyGurl.Api.Hubs;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace SassyGurl.Api.Services;

/// <summary>
/// Background service that pings Digiflazz and VIP Reseller APIs every 5 minutes
/// and broadcasts latency/status via SignalR to Owner dashboards.
/// Memory-efficient: runs on a single TimerPeriodic, no heap pressure.
/// </summary>
public class ProviderHealthMonitor : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ProviderHealthMonitor> _logger;
    private static readonly TimeSpan _interval = TimeSpan.FromMinutes(15);

    public ProviderHealthMonitor(
        IServiceScopeFactory scopeFactory,
        IHubContext<NotificationHub> hub,
        IHttpClientFactory httpClientFactory,
        ILogger<ProviderHealthMonitor> logger)
    {
        _scopeFactory = scopeFactory;
        _hub = hub;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ProviderHealthMonitor started. Ping interval: {Interval}", _interval);

        // Initial delay to let the app fully start
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SassyGurl.Api.Data.SassyGurlDbContext>();
                var telegram = scope.ServiceProvider.GetRequiredService<ITelegramService>();
                var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
                var adminPhone = config["WhatsApp:AdminPhone"];

                var providers = db.Providers.ToList();
                foreach (var provider in providers)
                {
                    // For Digiflazz, VIP, etc.
                    string baseUrl = provider.Name.ToLower().Contains("digi") ? "https://api.digiflazz.com/v1/" : "https://vipreseller.co.id/api/";
                    await PingProviderAsync(db, provider, baseUrl, stoppingToken);

                    if (provider.Balance < 500000)
                    {
                        var msg = $"⚠️ ALERT: Saldo {provider.Name} menipis! Sisa saldo: Rp {provider.Balance:N0}";
                        _logger.LogWarning(msg);
                        _ = telegram.SendLowBalanceAlertAsync(provider.Name, provider.Balance, 500000);
                        
                        if (!string.IsNullOrEmpty(adminPhone))
                        {
                            var wa = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();
                            // Sending as a generic alert to admin
                            _ = wa.SendOrderFailedAsync(adminPhone, "SYS-ALERT", msg);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ProviderHealthMonitor encountered an error");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task PingProviderAsync(SassyGurl.Api.Data.SassyGurlDbContext db, SassyGurl.Api.Models.Provider provider, string baseUrl, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        bool isActive;
        int latency = -1;

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            var response = await client.GetAsync(baseUrl, ct);
            sw.Stop();
            latency = (int)sw.ElapsedMilliseconds;
            isActive = true;
        }
        catch (Exception ex)
        {
            sw.Stop();
            isActive = false;
            _logger.LogError(ex, "Provider {Name} is DOWN or returned error.", provider.Name);
            
            // Alert throttling logic
            await HandleProviderDownAlertAsync(provider.Name);
        }

        // Real Success Rate calculation (last 100 transactions)
        var recentTxs = await db.Transactions
            .Where(t => t.Product.ProviderId == provider.Id && (t.OrderStatus == SassyGurl.Api.Models.Enums.OrderStatus.SUCCESS || t.OrderStatus == SassyGurl.Api.Models.Enums.OrderStatus.ERROR))
            .OrderByDescending(t => t.CreatedAt)
            .Take(100)
            .Select(t => t.OrderStatus)
            .ToListAsync(ct);

        decimal successRate = -1m; // N/A
        if (recentTxs.Any())
        {
            int successCount = recentTxs.Count(t => t == SassyGurl.Api.Models.Enums.OrderStatus.SUCCESS);
            successRate = Math.Round((decimal)successCount / recentTxs.Count * 100, 1);
        }

        // Update provider entity
        provider.IsActive = isActive;
        provider.SuccessRate = successRate;
        provider.AvgLatencyMs = latency;
        await db.SaveChangesAsync(ct);

        var payload = new ProviderStatusPayload(
            provider.Name,
            isActive,
            successRate,
            latency,
            DateTime.UtcNow
        );

        _logger.LogInformation("Provider {Name}: Active={Active}, Latency={Latency}ms, SuccessRate={Rate}", provider.Name, isActive, latency, successRate);
        await NotificationBroadcaster.BroadcastProviderStatus(_hub, payload);
    }

    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, DateTime> _lastAlerts = new();

    private async Task HandleProviderDownAlertAsync(string providerName)
    {
        try
        {
            var now = DateTime.UtcNow;
            if (_lastAlerts.TryGetValue(providerName, out var lastAlertTime))
            {
                if ((now - lastAlertTime).TotalMinutes < 30)
                {
                    _logger.LogDebug("Alert for {Name} suppressed (throttled).", providerName);
                    return;
                }
            }

            _lastAlerts[providerName] = now;

            using var scope = _scopeFactory.CreateScope();
            var telegram = scope.ServiceProvider.GetRequiredService<ITelegramService>();
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var adminPhone = config["WhatsApp:AdminPhone"];

            var msg = $"🚨 API ERROR: Provider {providerName} is DOWN atau Timeout!";
            _ = telegram.SendSystemErrorAlertAsync("Provider Offline", msg);

            if (!string.IsNullOrEmpty(adminPhone))
            {
                var wa = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();
                _ = wa.SendOrderFailedAsync(adminPhone, "SYS-ALERT", msg);
            }
        }
        catch { /* fail silently on alert failure */ }
    }
}

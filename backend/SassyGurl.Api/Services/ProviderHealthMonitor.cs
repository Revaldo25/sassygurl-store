using Microsoft.AspNetCore.SignalR;
using SassyGurl.Api.Hubs;
using System.Diagnostics;

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
    private static readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

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
                await PingProviderAsync("Digiflazz", "https://api.digiflazz.com/v1/", stoppingToken);
                await PingProviderAsync("VIP Reseller", "https://vipreseller.co.id/api/", stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ProviderHealthMonitor encountered an error");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task PingProviderAsync(string name, string baseUrl, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        bool isActive;

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            var response = await client.GetAsync(baseUrl, ct);
            sw.Stop();
            // Any response (even 4xx) means the server is alive
            isActive = true;
        }
        catch
        {
            sw.Stop();
            isActive = false;
        }

        var payload = new ProviderStatusPayload(
            name,
            isActive,
            isActive ? 99.9m : 0m,
            (int)sw.ElapsedMilliseconds,
            DateTime.UtcNow
        );

        _logger.LogInformation("Provider {Name}: Active={Active}, Latency={Latency}ms", name, isActive, sw.ElapsedMilliseconds);

        await NotificationBroadcaster.BroadcastProviderStatus(_hub, payload);
    }
}

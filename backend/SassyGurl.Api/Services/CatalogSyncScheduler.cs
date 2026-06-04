using System.Diagnostics;

namespace SassyGurl.Api.Services;

/// <summary>
/// Background service that periodically runs ISyncEngine.SyncAllAsync().
/// Default interval is 6 hours, configurable via Sync:IntervalHours.
/// Uses the existing locks inside SyncEngine to prevent collisions with manual syncs.
/// </summary>
public class CatalogSyncScheduler : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CatalogSyncScheduler> _logger;

    public CatalogSyncScheduler(
        IServiceScopeFactory scopeFactory,
        ILogger<CatalogSyncScheduler> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait 5 seconds before first run to let app and db initialize fully
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            TimeSpan interval = TimeSpan.FromHours(6); // default

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
                var telegram = scope.ServiceProvider.GetRequiredService<ITelegramService>();
                var syncEngine = scope.ServiceProvider.GetRequiredService<ISyncEngine>();

                if (double.TryParse(config["Sync:IntervalHours"], out double configHours) && configHours > 0)
                {
                    interval = TimeSpan.FromHours(configHours);
                }

                if (!config.GetValue<bool>("Features:EnableScheduledCatalogSync"))
                {
                    _logger.LogInformation("CatalogSyncScheduler: Scheduled sync is DISABLED via feature flag. Skipping.");
                    await Task.Delay(interval, stoppingToken);
                    continue;
                }

                _logger.LogInformation("CatalogSyncScheduler: Starting scheduled sync...");

                var sw = Stopwatch.StartNew();
                var result = await syncEngine.SyncAllAsync();
                sw.Stop();

                if (result.Errors > 0)
                {
                    _logger.LogWarning("CatalogSyncScheduler: Sync completed with {Errors} errors.", result.Errors);
                    _ = telegram.SendSystemErrorAlertAsync("Catalog Sync", $"Scheduled sync completed with {result.Errors} errors in {sw.ElapsedMilliseconds}ms.");
                }
                else
                {
                    _logger.LogInformation("CatalogSyncScheduler: Sync completed successfully in {Duration}ms. Created={C}, Updated={U}", 
                        sw.ElapsedMilliseconds, result.Created, result.Updated);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CatalogSyncScheduler: Fatal error during sync execution.");
                
                try 
                {
                    using var alertScope = _scopeFactory.CreateScope();
                    var telegram = alertScope.ServiceProvider.GetRequiredService<ITelegramService>();
                    _ = telegram.SendSystemErrorAlertAsync("Catalog Sync", $"FATAL error during scheduled sync: {ex.Message}");
                }
                catch { /* ignore alert failures */ }
            }

            _logger.LogInformation("CatalogSyncScheduler: Sleeping for {Interval}", interval);
            await Task.Delay(interval, stoppingToken);
        }
    }
}

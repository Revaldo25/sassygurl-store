using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;

namespace SassyGurl.Api.Services;

public class WhatsAppBlastWorker : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<WhatsAppBlastWorker> _logger;
    private static readonly TimeSpan _interval = TimeSpan.FromSeconds(4);

    public WhatsAppBlastWorker(IServiceProvider services, ILogger<WhatsAppBlastWorker> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("WhatsAppBlastWorker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessNextQueueAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in WhatsAppBlastWorker.");
            }

            // Always delay 4 seconds to prevent banning, regardless of success/fail
            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task ProcessNextQueueAsync(CancellationToken stoppingToken)
    {
        using var scope = _services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SassyGurlDbContext>();
        var whatsAppService = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();

        // Fetch 1 pending message
        var item = await context.NotificationQueues
            .Where(q => q.Status == "PENDING")
            .OrderBy(q => q.CreatedAt)
            .FirstOrDefaultAsync(stoppingToken);

        if (item == null) return; // Nothing to process

        _logger.LogInformation("Processing Blast Queue ID {QueueId} for {Phone}", item.Id, item.TargetPhone);

        var success = await whatsAppService.SendMessageAsync(item.TargetPhone, item.Message);

        item.Status = success ? "SENT" : "FAILED";
        item.ErrorMessage = success ? null : "Failed to send via Fonnte API";
        item.ProcessedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(stoppingToken);
    }
}

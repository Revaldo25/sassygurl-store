using SassyGurl.Application.Interfaces;

namespace SassyGurl.Api.Services;

public class WhatsAppChannelWorker : BackgroundService
{
    private readonly IWhatsAppNotificationQueue _queue;
    private readonly IServiceProvider _services;
    private readonly ILogger<WhatsAppChannelWorker> _logger;

    public WhatsAppChannelWorker(
        IWhatsAppNotificationQueue queue,
        IServiceProvider services,
        ILogger<WhatsAppChannelWorker> logger)
    {
        _queue = queue;
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("WhatsAppChannelWorker is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var workItem = await _queue.DequeueAsync(stoppingToken);

                using var scope = _services.CreateScope();
                var whatsAppService = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();

                _logger.LogInformation("Sending urgent WhatsApp notification to {Phone}", workItem.Phone);
                
                await whatsAppService.SendMessageAsync(workItem.Phone, workItem.Message);

                // Delay slightly to prevent Fonnte API rate limit
                await Task.Delay(500, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Prevent throwing if stoppingToken is canceled
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing WhatsAppChannelWorker.");
            }
        }

        _logger.LogInformation("WhatsAppChannelWorker is stopping.");
    }
}

public class EmailChannelWorker : BackgroundService
{
    private readonly IEmailNotificationQueue _queue;
    private readonly IServiceProvider _services;
    private readonly ILogger<EmailChannelWorker> _logger;

    public EmailChannelWorker(
        IEmailNotificationQueue queue,
        IServiceProvider services,
        ILogger<EmailChannelWorker> logger)
    {
        _queue = queue;
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailChannelWorker is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var workItem = await _queue.DequeueAsync(stoppingToken);

                using var scope = _services.CreateScope();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                _logger.LogInformation("Sending urgent Email notification to {Email}", workItem.ToEmail);
                
                await emailService.SendEmailAsync(workItem.ToEmail, workItem.Subject, workItem.HtmlBody);

                // Delay slightly to prevent SMTP rate limit
                await Task.Delay(500, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Prevent throwing if stoppingToken is canceled
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing EmailChannelWorker.");
            }
        }

        _logger.LogInformation("EmailChannelWorker is stopping.");
    }
}

namespace SassyGurl.Api.Services;

/// <summary>
/// Unified notification orchestrator.
/// Coordinates WhatsApp (Fonnte) → Customer and Telegram → Admin for every transaction event.
/// </summary>
public interface INotificationOrchestrator
{
    Task NotifyPaymentReceivedAsync(NotificationContext ctx);
    Task NotifyOrderSuccessAsync(NotificationContext ctx);
    Task NotifyOrderFailedAsync(NotificationContext ctx);
    Task NotifyLowBalanceAsync(string providerName, decimal balance, decimal threshold);
    Task NotifySystemErrorAsync(string context, string errorMessage);
}

public class NotificationContext
{
    public string Phone { get; set; } = null!;
    public string InvoiceId { get; set; } = null!;
    public string GameName { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public decimal Amount { get; set; }
    public decimal Margin { get; set; }
    public string? Sn { get; set; }
    public string ProviderStatus { get; set; } = "Pending";
    public decimal Savings { get; set; } = 0;
}

public class NotificationOrchestrator : INotificationOrchestrator
{
    private readonly IWhatsAppService _whatsApp;
    private readonly ITelegramService _telegram;
    private readonly ILogger<NotificationOrchestrator> _logger;

    public NotificationOrchestrator(
        IWhatsAppService whatsApp,
        ITelegramService telegram,
        ILogger<NotificationOrchestrator> logger)
    {
        _whatsApp = whatsApp;
        _telegram = telegram;
        _logger = logger;
    }

    private void FireAndForget(Func<Task> action, string notificationName, string contextId)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                for (int i = 0; i < 2; i++)
                {
                    try
                    {
                        await action();
                        return;
                    }
                    catch (Exception) when (i == 0)
                    {
                        // Minimal retry
                        await Task.Delay(1000);
                    }
                }
            }
            catch (Exception ex)
            {
                // No silent swallowed failures. Must log.
                _logger.LogError(ex, "Notification {NotificationName} failed for {ContextId} after retries.", notificationName, contextId);
            }
        });
    }

    public Task NotifyPaymentReceivedAsync(NotificationContext ctx)
    {
        FireAndForget(() => _whatsApp.SendPaymentReceivedAsync(ctx.Phone, ctx.InvoiceId, ctx.GameName, ctx.ProductName), "WhatsApp.PaymentReceived", ctx.InvoiceId);
        FireAndForget(() => _telegram.SendAdminReportAsync(ctx.GameName, ctx.ProductName, ctx.Margin, "💳 Payment Received — Triggering Provider", ctx.InvoiceId), "Telegram.AdminReport", ctx.InvoiceId);

        _logger.LogInformation("Payment notification dispatched for {Invoice}", ctx.InvoiceId);
        return Task.CompletedTask;
    }

    public Task NotifyOrderSuccessAsync(NotificationContext ctx)
    {
        FireAndForget(() => _whatsApp.SendOrderSuccessAsync(ctx.Phone, ctx.InvoiceId, ctx.GameName, ctx.ProductName, ctx.Sn, ctx.Savings), "WhatsApp.OrderSuccess", ctx.InvoiceId);
        FireAndForget(() => _telegram.SendAdminReportAsync(ctx.GameName, ctx.ProductName, ctx.Margin, $"✅ Success | SN: {ctx.Sn ?? "N/A"}", ctx.InvoiceId), "Telegram.AdminReport", ctx.InvoiceId);

        _logger.LogInformation("Success notification dispatched for {Invoice}", ctx.InvoiceId);
        return Task.CompletedTask;
    }

    public Task NotifyOrderFailedAsync(NotificationContext ctx)
    {
        FireAndForget(() => _whatsApp.SendOrderFailedAsync(ctx.Phone, ctx.InvoiceId, ctx.ProviderStatus), "WhatsApp.OrderFailed", ctx.InvoiceId);
        FireAndForget(() => _telegram.SendAdminReportAsync(ctx.GameName, ctx.ProductName, ctx.Margin, $"❌ FAILED: {ctx.ProviderStatus}", ctx.InvoiceId), "Telegram.AdminReport", ctx.InvoiceId);

        _logger.LogWarning("Failure notification dispatched for {Invoice}", ctx.InvoiceId);
        return Task.CompletedTask;
    }

    public Task NotifyLowBalanceAsync(string providerName, decimal balance, decimal threshold)
    {
        FireAndForget(() => _telegram.SendLowBalanceAlertAsync(providerName, balance, threshold), "Telegram.LowBalance", providerName);
        _logger.LogWarning("Low balance notification dispatched for {Provider}", providerName);
        return Task.CompletedTask;
    }

    public Task NotifySystemErrorAsync(string context, string errorMessage)
    {
        FireAndForget(() => _telegram.SendSystemErrorAlertAsync(context, errorMessage), "Telegram.SystemError", context);
        _logger.LogWarning("System error notification dispatched for {Context}", context);
        return Task.CompletedTask;
    }
}

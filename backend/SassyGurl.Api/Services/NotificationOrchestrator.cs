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

    public async Task NotifyPaymentReceivedAsync(NotificationContext ctx)
    {
        // WhatsApp → Customer
        _ = _whatsApp.SendPaymentReceivedAsync(ctx.Phone, ctx.InvoiceId, ctx.GameName, ctx.ProductName);

        // Telegram → Admin
        _ = _telegram.SendAdminReportAsync(
            ctx.GameName, ctx.ProductName, ctx.Margin, 
            "💳 Payment Received — Triggering Provider", ctx.InvoiceId);

        _logger.LogInformation("Payment notification dispatched for {Invoice}", ctx.InvoiceId);
        await Task.CompletedTask;
    }

    public async Task NotifyOrderSuccessAsync(NotificationContext ctx)
    {
        // WhatsApp → Customer (with digital receipt showing voucher savings)
        _ = _whatsApp.SendOrderSuccessAsync(ctx.Phone, ctx.InvoiceId, ctx.GameName, ctx.ProductName, ctx.Sn, ctx.Savings);

        // Telegram → Admin
        _ = _telegram.SendAdminReportAsync(
            ctx.GameName, ctx.ProductName, ctx.Margin,
            $"✅ Success | SN: {ctx.Sn ?? "N/A"}", ctx.InvoiceId);

        _logger.LogInformation("Success notification dispatched for {Invoice}", ctx.InvoiceId);
        await Task.CompletedTask;
    }

    public async Task NotifyOrderFailedAsync(NotificationContext ctx)
    {
        // WhatsApp → Customer
        _ = _whatsApp.SendOrderFailedAsync(ctx.Phone, ctx.InvoiceId, ctx.ProviderStatus);

        // Telegram → Admin  
        _ = _telegram.SendAdminReportAsync(
            ctx.GameName, ctx.ProductName, ctx.Margin,
            $"❌ FAILED: {ctx.ProviderStatus}", ctx.InvoiceId);

        _logger.LogWarning("Failure notification dispatched for {Invoice}", ctx.InvoiceId);
        await Task.CompletedTask;
    }

    public async Task NotifyLowBalanceAsync(string providerName, decimal balance, decimal threshold)
    {
        _ = _telegram.SendLowBalanceAlertAsync(providerName, balance, threshold);
        _logger.LogWarning("Low balance notification dispatched for {Provider}", providerName);
        await Task.CompletedTask;
    }

    public async Task NotifySystemErrorAsync(string context, string errorMessage)
    {
        _ = _telegram.SendSystemErrorAlertAsync(context, errorMessage);
        _logger.LogWarning("System error notification dispatched for {Context}", context);
        await Task.CompletedTask;
    }
}

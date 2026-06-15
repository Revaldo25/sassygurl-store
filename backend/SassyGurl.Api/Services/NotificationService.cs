using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace SassyGurl.Api.Services;

public interface INotificationService
{
    Task SendWhatsAppInvoiceAsync(string whatsappNumber, string invoiceId, string gameName, string productName, string transactionId);
    Task SendTelegramAlertAsync(string message);
}

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ILogger<NotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendWhatsAppInvoiceAsync(string whatsappNumber, string invoiceId, string gameName, string productName, string transactionId)
    {
        if (string.IsNullOrWhiteSpace(whatsappNumber))
            return Task.CompletedTask;

        // Mock WhatsApp integration for Demo
        string msg = $@"
=============================
📱 *SASSYGURL STORE - INVOICE* 📱
=============================
Terima kasih telah berbelanja di SassyGurl Store!

*Invoice:* {invoiceId}
*Game:* {gameName}
*Item:* {productName}
*Trx ID:* {transactionId}

Pesanan Anda sedang diproses dan akan masuk ke akun dalam beberapa detik!
Jika ada kendala, hubungi Admin kami.
=============================
";
        _logger.LogInformation(">>> [WHATSAPP MOCK] Mengirim pesan ke {PhoneNumber}...\n{Message}", whatsappNumber, msg);
        
        return Task.CompletedTask;
    }

    public Task SendTelegramAlertAsync(string message)
    {
        _logger.LogInformation(">>> [TELEGRAM MOCK] Mengirim notifikasi: {Message}", message);
        return Task.CompletedTask;
    }
}

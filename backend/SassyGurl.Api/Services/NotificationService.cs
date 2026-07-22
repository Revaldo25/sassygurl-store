using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace SassyGurl.Api.Services;

public interface INotificationService
{
    Task SendWhatsAppInvoiceAsync(string whatsappNumber, string invoiceId, string gameName, string productName, string transactionId);
    Task SendTelegramAlertAsync(string message);
    Task SendWebPushAsync(string endpoint, string p256dh, string auth, string title, string message);
}

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _config;

    public NotificationService(ILogger<NotificationService> logger, Microsoft.Extensions.Configuration.IConfiguration config)
    {
        _logger = logger;
        _config = config;
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

    public async Task SendWebPushAsync(string endpoint, string p256dh, string auth, string title, string message)
    {
        var subject = _config["Vapid:Subject"] ?? "mailto:admin@sassygurlstore.com";
        var publicKey = _config["Vapid:PublicKey"];
        var privateKey = _config["Vapid:PrivateKey"];

        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(privateKey))
        {
            _logger.LogWarning("VAPID Keys are missing. Cannot send Web Push Notification.");
            return;
        }

        var vapidDetails = new WebPush.VapidDetails(subject, publicKey, privateKey);
        var webPushClient = new WebPush.WebPushClient();

        try
        {
            var pushSubscription = new WebPush.PushSubscription(endpoint, p256dh, auth);
            var payload = System.Text.Json.JsonSerializer.Serialize(new { title, body = message, icon = "/icon-192x192.png" });
            
            await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
            _logger.LogInformation("Web Push notification sent to {Endpoint}", endpoint);
        }
        catch (WebPush.WebPushException exception)
        {
            _logger.LogError(exception, "Web Push Error: {StatusCode}", exception.StatusCode);
        }
    }
}

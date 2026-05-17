using System.Text;
using System.Text.Json;

namespace SassyGurl.Api.Services;

/// <summary>
/// Telegram Bot notification service.
/// Sends real-time transaction reports to the admin chat.
/// </summary>
public interface ITelegramService
{
    Task<bool> SendAdminReportAsync(string gameName, string productName, decimal margin, string providerStatus, string invoiceId);
    Task<bool> SendMessageAsync(string message);
    Task<bool> SendLowBalanceAlertAsync(string providerName, decimal balance, decimal threshold);
    Task<bool> SendSystemErrorAlertAsync(string context, string errorMessage);
}

public class TelegramService : ITelegramService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<TelegramService> _logger;

    public TelegramService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<TelegramService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendAdminReportAsync(
        string gameName, string productName, decimal margin, 
        string providerStatus, string invoiceId)
    {
        var message = $"""
        📊 *Laporan Transaksi — SassyGurl Store*
        
        🧾 Invoice: `{invoiceId}`
        🎮 Game: {gameName}
        📦 Produk: {productName}
        💰 Margin Keuntungan: Rp {margin:N0}
        🔌 Status Provider: {providerStatus}
        🕐 Waktu: {DateTime.Now:dd/MM/yyyy HH:mm:ss}
        """;

        return await SendMessageAsync(message.Trim());
    }

    public async Task<bool> SendLowBalanceAlertAsync(string providerName, decimal balance, decimal threshold)
    {
        var message = $"""
        🚨 *CRITICAL ALERT: LOW BALANCE*
        
        🔌 Provider: {providerName}
        💰 Sisa Saldo: Rp {balance:N0}
        📉 Ambang Batas: Rp {threshold:N0}
        🕐 Waktu: {DateTime.Now:dd/MM/yyyy HH:mm:ss}
        
        Mohon segera lakukan top up saldo {providerName} untuk menghindari kegagalan transaksi!
        """;

        return await SendMessageAsync(message.Trim());
    }

    public async Task<bool> SendSystemErrorAlertAsync(string context, string errorMessage)
    {
        var message = $"""
        🔥 *SYSTEM ERROR DETECTED*
        
        📍 Context: {context}
        ❌ Error: `{errorMessage}`
        🕐 Waktu: {DateTime.Now:dd/MM/yyyy HH:mm:ss}
        
        Mohon periksa log server secepatnya.
        """;

        return await SendMessageAsync(message.Trim());
    }

    public async Task<bool> SendMessageAsync(string message)
    {
        var botToken = _config["Telegram:BotToken"];
        var chatId = _config["Telegram:AdminChatId"] ?? "7448250558";

        if (string.IsNullOrEmpty(botToken))
        {
            _logger.LogWarning("Telegram BotToken not configured. Skipping notification.");
            return false;
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            var url = $"https://api.telegram.org/bot{botToken}/sendMessage";

            var payload = new
            {
                chat_id = chatId,
                text = message,
                parse_mode = "Markdown"
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            var response = await client.PostAsync(url, jsonContent);
            var body = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("Telegram notification sent: {StatusCode}", response.StatusCode);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Telegram notification.");
            return false;
        }
    }
}

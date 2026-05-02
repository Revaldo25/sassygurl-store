using System.Text.Json;

namespace SassyGurl.Api.Services;

/// <summary>
/// WhatsApp notification gateway via Fonnte API.
/// Sends order status updates to Member's WhatsApp number.
/// API Key stored in User Secrets (never in source code).
/// </summary>
public interface IWhatsAppService
{
    Task<bool> SendOrderCreatedAsync(string phone, string invoiceId, string gameName, string productName, decimal amount);
    Task<bool> SendPaymentReceivedAsync(string phone, string invoiceId, string gameName, string productName);
    Task<bool> SendOrderSuccessAsync(string phone, string invoiceId, string gameName, string productName, string? sn);
    Task<bool> SendOrderFailedAsync(string phone, string invoiceId, string reason);
}

public class WhatsAppService : IWhatsAppService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WhatsAppService> _logger;

    public WhatsAppService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<WhatsAppService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SendOrderCreatedAsync(string phone, string invoiceId, string gameName, string productName, decimal amount)
    {
        var message = $"""
        🛒 *Pesanan Dibuat — Menunggu Pembayaran*

        🎮 Game: {gameName}
        📦 Produk: {productName}
        💰 Total: Rp {amount:N0}
        🧾 Invoice: {invoiceId}

        Silakan selesaikan pembayaran Anda.
        Link Invoice: https://sassygurl.store/invoice/{invoiceId}

        *SassyGurl Store* 💖
        """;

        return await SendMessageAsync(phone, message.Trim());
    }

    public async Task<bool> SendPaymentReceivedAsync(string phone, string invoiceId, string gameName, string productName)
    {
        var message = $"""
        💳 *Pembayaran Diterima!*

        🎮 Game: {gameName}
        📦 Produk: {productName}
        🧾 Invoice: {invoiceId}
        ⏳ Status: Sedang Diproses

        Top-up Anda sedang diproses oleh provider.
        Anda akan menerima konfirmasi dalam beberapa menit.

        *SassyGurl Store* 💖
        """;

        return await SendMessageAsync(phone, message.Trim());
    }

    public async Task<bool> SendOrderSuccessAsync(string phone, string invoiceId, string gameName, string productName, string? sn)
    {
        var message = $"""
        ✅ *Top-Up Berhasil!*

        🎮 Game: {gameName}
        📦 Produk: {productName}
        🧾 Invoice: {invoiceId}
        {(sn != null ? $"🔑 SN: {sn}" : "")}

        Terima kasih sudah belanja di *SassyGurl Store*! 💖
        Butuh bantuan? Hubungi CS kami.
        """;

        return await SendMessageAsync(phone, message.Trim());
    }

    public async Task<bool> SendOrderFailedAsync(string phone, string invoiceId, string reason)
    {
        var message = $"""
        ⚠️ *Pesanan Membutuhkan Perhatian*

        🧾 Invoice: {invoiceId}
        📝 Status: Gagal diproses

        Tim kami sedang menangani pesanan Anda.
        Dana Anda aman dan akan di-refund jika tidak dapat diproses.

        Hubungi CS untuk info lebih lanjut.
        *SassyGurl Store* 💖
        """;

        return await SendMessageAsync(phone, message.Trim());
    }

    private async Task<bool> SendMessageAsync(string phone, string message)
    {
        var apiToken = _configuration["Fonnte:ApiToken"];
        if (string.IsNullOrEmpty(apiToken))
        {
            _logger.LogWarning("Fonnte API token not configured. Skipping WhatsApp notification.");
            return false;
        }

        // Normalize phone number (add 62 prefix if starts with 0)
        if (phone.StartsWith("0"))
            phone = "62" + phone[1..];

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", apiToken);

            var formContent = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("target", phone),
                new KeyValuePair<string, string>("message", message),
            });

            var response = await client.PostAsync("https://api.fonnte.com/send", formContent);
            var body = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("WhatsApp sent to {Phone}: {Status} - {Body}", phone, response.StatusCode, body);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send WhatsApp to {Phone}", phone);
            return false;
        }
    }
}

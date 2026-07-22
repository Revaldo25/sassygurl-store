using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace SassyGurl.Api.Services;

public class MidtransService : IMidtransService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MidtransService> _logger;

    public MidtransService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<MidtransService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string?> GenerateSnapTokenAsync(
        string orderId, 
        decimal grossAmount, 
        string productName, 
        string customerName, 
        string customerEmail, 
        string customerPhone)
    {
        return $"SNAP-{Guid.NewGuid():N}";
        try
        {
            var serverKey = _configuration["Midtrans:ServerKey"];
            if (string.IsNullOrEmpty(serverKey))
            {
                _logger.LogWarning("Midtrans ServerKey not configured. Returning mock token.");
                return $"SNAP-{Guid.NewGuid():N}";
            }

            // Determine sandbox vs production based on key prefix
            var isSandbox = serverKey.StartsWith("SB-", StringComparison.OrdinalIgnoreCase);
            var baseUrl = isSandbox
                ? "https://app.sandbox.midtrans.com/snap/v1/transactions"
                : "https://app.midtrans.com/snap/v1/transactions";

            var payload = new MidtransSnapRequest
            {
                TransactionDetails = new MidtransTransactionDetails
                {
                    OrderId = orderId,
                    GrossAmount = Math.Ceiling(grossAmount) // Midtrans requires integer-like amounts
                },
                ItemDetails = new List<MidtransItemDetails>
                {
                    new()
                    {
                        Id = "TOPUP-001",
                        Price = Math.Ceiling(grossAmount),
                        Quantity = 1,
                        Name = productName.Length > 50 ? productName[..50] : productName
                    }
                },
                CustomerDetails = new MidtransCustomerDetails
                {
                    FirstName = string.IsNullOrEmpty(customerName) ? "SassyGurl Customer" : customerName,
                    Email = string.IsNullOrEmpty(customerEmail) ? "customer@sassygurl.com" : customerEmail,
                    Phone = string.IsNullOrEmpty(customerPhone) ? "08123456789" : customerPhone
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            _logger.LogInformation("Midtrans Snap Request: OrderId={OrderId}, Amount={Amount}", orderId, grossAmount);

            var client = _httpClientFactory.CreateClient();
            var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{serverKey}:"));
            
            var request = new HttpRequestMessage(HttpMethod.Post, baseUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authValue);
            request.Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("Midtrans Snap Response: Status={Status}, Body={Body}", 
                response.StatusCode, responseBody);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Midtrans Snap API failed: {Status} {Body}", response.StatusCode, responseBody);
                return null;
            }

            var snapResponse = JsonSerializer.Deserialize<MidtransSnapResponse>(responseBody);
            
            if (string.IsNullOrEmpty(snapResponse?.Token))
            {
                _logger.LogError("Midtrans returned empty token. Body: {Body}", responseBody);
                return null;
            }

            _logger.LogInformation("Midtrans Snap Token generated: {Token} for OrderId={OrderId}", 
                snapResponse.Token[..8] + "...", orderId);
            
            return snapResponse.Token;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Midtrans Snap token for OrderId={OrderId}", orderId);
            return null;
        }
    }

    public async Task<JsonDocument?> GetTransactionStatusAsync(string orderId)
    {
        try
        {
            var serverKey = _configuration["Midtrans:ServerKey"];
            if (string.IsNullOrEmpty(serverKey)) return null;

            var isSandbox = serverKey.StartsWith("SB-", StringComparison.OrdinalIgnoreCase);
            var baseUrl = isSandbox
                ? $"https://api.sandbox.midtrans.com/v2/{orderId}/status"
                : $"https://api.midtrans.com/v2/{orderId}/status";

            var client = _httpClientFactory.CreateClient();
            var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{serverKey}:"));
            
            var request = new HttpRequestMessage(HttpMethod.Get, baseUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authValue);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound) return null; // Not found yet in midtrans
                _logger.LogWarning("Midtrans status check failed for {OrderId}: {Status}", orderId, response.StatusCode);
                return null;
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            return JsonDocument.Parse(responseBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check Midtrans status for OrderId={OrderId}", orderId);
            return null;
        }
    }
}


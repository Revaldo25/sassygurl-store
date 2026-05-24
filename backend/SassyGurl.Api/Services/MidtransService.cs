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
        try
        {
            var serverKey = _configuration["Midtrans:ServerKey"];
            if (string.IsNullOrEmpty(serverKey))
            {
                _logger.LogError("Midtrans:ServerKey is missing in configuration.");
                return null;
            }

            // Always Sandbox for this phase
            var url = "https://app.sandbox.midtrans.com/snap/v1/transactions";

            var requestBody = new MidtransSnapRequest
            {
                TransactionDetails = new MidtransTransactionDetails
                {
                    OrderId = orderId,
                    GrossAmount = grossAmount
                },
                ItemDetails = new List<MidtransItemDetails>
                {
                    new MidtransItemDetails
                    {
                        Id = "ITEM-1",
                        Price = grossAmount,
                        Quantity = 1,
                        Name = productName.Length > 50 ? productName.Substring(0, 50) : productName // Midtrans limits length
                    }
                },
                CustomerDetails = new MidtransCustomerDetails
                {
                    FirstName = customerName,
                    Email = string.IsNullOrEmpty(customerEmail) ? "no-email@sassygurl.com" : customerEmail,
                    Phone = customerPhone
                }
            };

            var jsonBody = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

            var client = _httpClientFactory.CreateClient("MidtransClient");
            var authHeader = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{serverKey}:"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authHeader);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var response = await client.PostAsync(url, content);
            var responseJson = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Midtrans Snap API Error: {StatusCode} - {Body}", response.StatusCode, responseJson);
                return null;
            }

            var snapResponse = JsonSerializer.Deserialize<MidtransSnapResponse>(responseJson);
            return snapResponse?.Token;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Midtrans Snap token for OrderId={OrderId}", orderId);
            return null;
        }
    }
}

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
            // MOCK MODE: Always return a mock SNAP token for demo purposes.
            // The frontend is programmed to intercept "SNAP-" tokens and redirect to the invoice directly,
            // avoiding the "This request is currently being processed" Midtrans sandbox error.
            return $"SNAP-{Guid.NewGuid():N}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Midtrans Snap token for OrderId={OrderId}", orderId);
            return null;
        }
    }
}

using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace SassyGurl.Api.Services.Providers;

public class DigiflazzAdapter : IProviderAdapter
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DigiflazzAdapter> _logger;

    public DigiflazzAdapter(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<DigiflazzAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public string ProviderName => "Digiflazz";

    public async Task<ProviderOrderResult> PlaceOrderAsync(string sku, string targetId, string zoneId, string refId)
    {
        var username = _configuration["Digiflazz:Username"];
        var apiKey = _configuration["Digiflazz:ApiKey"];
        
        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(apiKey))
        {
            return new ProviderOrderResult { IsSuccess = false, Message = "Digiflazz credentials not configured." };
        }

        var sign = CreateMD5($"{username}{apiKey}{refId}");
        var client = _httpClientFactory.CreateClient("DigiflazzClient");

        var payload = new
        {
            username = username,
            buyer_sku_code = sku,
            customer_no = string.IsNullOrEmpty(zoneId) ? targetId : $"{targetId}{zoneId}",
            ref_id = refId,
            sign = sign
        };

        try
        {
            var response = await client.PostAsJsonAsync("transaction", payload);
            var contentStr = await response.Content.ReadAsStringAsync();
            var content = JsonSerializer.Deserialize<JsonElement>(contentStr);

            if (content.TryGetProperty("data", out var data))
            {
                var status = data.GetProperty("status").GetString();
                var message = data.GetProperty("message").GetString();
                var sn = data.TryGetProperty("sn", out var snProp) ? snProp.GetString() : null;

                if (status == "Sukses" || status == "Pending")
                {
                    return new ProviderOrderResult 
                    { 
                        IsSuccess = true, 
                        ProviderName = ProviderName,
                        ProviderRef = refId,
                        Sn = sn,
                        Message = message 
                    };
                }
                
                return new ProviderOrderResult { IsSuccess = false, Message = message ?? "Gagal dari provider.", ProviderName = ProviderName };
            }
            
            return new ProviderOrderResult { IsSuccess = false, Message = "Invalid response format from Digiflazz", ProviderName = ProviderName };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Digiflazz API Exception");
            return new ProviderOrderResult { IsSuccess = false, Message = "Connection to Digiflazz failed.", ProviderName = ProviderName };
        }
    }

    private static string CreateMD5(string input)
    {
        using var md5 = MD5.Create();
        var inputBytes = Encoding.UTF8.GetBytes(input);
        var hashBytes = md5.ComputeHash(inputBytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}

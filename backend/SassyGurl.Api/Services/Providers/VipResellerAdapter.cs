using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace SassyGurl.Api.Services.Providers;

public class VipResellerAdapter : IProviderAdapter
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<VipResellerAdapter> _logger;

    public VipResellerAdapter(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<VipResellerAdapter> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public string ProviderName => "VIP Reseller";

    public async Task<ProviderOrderResult> PlaceOrderAsync(string sku, string targetId, string zoneId, string refId)
    {
        var apiKey = _configuration["VipReseller:ApiKey"];
        var apiId = _configuration["VipReseller:ApiId"];
        
        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiId))
        {
            return new ProviderOrderResult { IsSuccess = false, Message = "VIP Reseller credentials not configured." };
        }

        var sign = CreateMD5($"{apiId}{apiKey}order");
        var client = _httpClientFactory.CreateClient("VipResellerClient");

        var formData = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("key", apiKey),
            new KeyValuePair<string, string>("sign", sign),
            new KeyValuePair<string, string>("type", "order"),
            new KeyValuePair<string, string>("service", sku),
            new KeyValuePair<string, string>("data_no", string.IsNullOrEmpty(zoneId) ? targetId : $"{targetId}|{zoneId}"),
            new KeyValuePair<string, string>("data_ref", refId)
        });

        try
        {
            var response = await client.PostAsync("game-feature", formData);
            var contentStr = await response.Content.ReadAsStringAsync();
            var content = JsonSerializer.Deserialize<JsonElement>(contentStr);

            if (content.TryGetProperty("result", out var resultProp) && resultProp.GetBoolean())
            {
                var data = content.GetProperty("data");
                var trxId = data.TryGetProperty("trxid", out var trxProp) ? trxProp.GetString() : refId;
                var sn = data.TryGetProperty("sn", out var snProp) ? snProp.GetString() : null;

                return new ProviderOrderResult
                {
                    IsSuccess = true,
                    ProviderName = ProviderName,
                    ProviderRef = trxId,
                    Sn = sn,
                    Message = "Success via VIP Reseller fallback."
                };
            }

            var errorMsg = content.TryGetProperty("message", out var msgProp) ? msgProp.GetString() : "Unknown error from VIP Reseller";
            return new ProviderOrderResult { IsSuccess = false, Message = errorMsg, ProviderName = ProviderName };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "VIP Reseller API Exception");
            return new ProviderOrderResult { IsSuccess = false, Message = "Connection to VIP Reseller failed.", ProviderName = ProviderName };
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

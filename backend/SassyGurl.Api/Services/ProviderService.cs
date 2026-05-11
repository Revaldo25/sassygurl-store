using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace SassyGurl.Api.Services;

public interface IProviderService
{
    Task<ProviderOrderResponse> PlaceOrderAsync(string sku, string targetId, string zoneId, string refId);
    Task<ProviderBalanceResponse> GetDigiflazzBalanceAsync();
}

public class ProviderService : IProviderService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ProviderService> _logger;
    private readonly IMemoryCache _cache;

    public ProviderService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ProviderService> logger,
        IMemoryCache cache)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _cache = cache;
    }

    public async Task<ProviderOrderResponse> PlaceOrderAsync(string sku, string targetId, string zoneId, string refId)
    {
        _logger.LogInformation("Processing order {RefId} for SKU {Sku}", refId, sku);

        // ── Phase 3: Balance check before transaction ──────────────────
        var balanceCheck = await GetDigiflazzBalanceAsync();
        if (balanceCheck.IsSuccess)
        {
            _logger.LogInformation("Digiflazz saldo saat ini: Rp {Balance:N0}", balanceCheck.Balance);
            if (balanceCheck.Balance < 1000)
            {
                _logger.LogCritical("Saldo Digiflazz terlalu rendah ({Balance}). Menolak order {RefId}.", balanceCheck.Balance, refId);
                return new ProviderOrderResponse { IsSuccess = false, Message = "Saldo provider tidak mencukupi. Hubungi admin." };
            }
        }

        // Attempt 1: Digiflazz (Primary Provider)
        var digiflazzResult = await OrderViaDigiflazzAsync(sku, targetId, zoneId, refId);
        
        if (digiflazzResult.IsSuccess)
        {
            return digiflazzResult;
        }

        _logger.LogWarning("Digiflazz failed for {RefId}: {Error}. Attempting fallback to VIP Reseller...", refId, digiflazzResult.Message);

        // Auto Fallback Logic: Attempt 2: VIP Reseller
        var vipResult = await OrderViaVipResellerAsync(sku, targetId, zoneId, refId);
        
        return vipResult;
    }

    public async Task<ProviderBalanceResponse> GetDigiflazzBalanceAsync()
    {
        var username = _configuration["Digiflazz:Username"];
        var apiKey = _configuration["Digiflazz:ApiKey"];
        
        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(apiKey))
        {
            return new ProviderBalanceResponse { IsSuccess = false, Message = "Digiflazz credentials not configured." };
        }

        var sign = CreateMD5($"{username}{apiKey}depo");
        var client = _httpClientFactory.CreateClient("DigiflazzClient");
        
        var payload = new
        {
            cmd = "deposit",
            username = username,
            sign = sign
        };

        try
        {
            var response = await client.PostAsJsonAsync("cek-saldo", payload);
            response.EnsureSuccessStatusCode();
            
            var content = await response.Content.ReadFromJsonAsync<JsonElement>();
            var data = content.GetProperty("data");
            
            return new ProviderBalanceResponse 
            { 
                Balance = data.GetProperty("deposit").GetDecimal(),
                IsSuccess = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Digiflazz balance");
            return new ProviderBalanceResponse { IsSuccess = false, Message = ex.Message };
        }
    }

    private async Task<ProviderOrderResponse> OrderViaDigiflazzAsync(string sku, string targetId, string zoneId, string refId)
    {
        var username = _configuration["Digiflazz:Username"];
        var apiKey = _configuration["Digiflazz:ApiKey"];
        
        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(apiKey))
        {
            return new ProviderOrderResponse { IsSuccess = false, Message = "Digiflazz credentials not configured." };
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
                    return new ProviderOrderResponse 
                    { 
                        IsSuccess = true, 
                        ProviderName = "Digiflazz",
                        ProviderRef = refId,
                        Sn = sn,
                        Message = message 
                    };
                }
                
                return new ProviderOrderResponse { IsSuccess = false, Message = message ?? "Gagal dari provider." };
            }
            
            return new ProviderOrderResponse { IsSuccess = false, Message = "Invalid response format from Digiflazz" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Digiflazz API Exception");
            return new ProviderOrderResponse { IsSuccess = false, Message = "Connection to Digiflazz failed." };
        }
    }

    /// <summary>
    /// Phase 3 Fallback: Order via VIP Reseller when Digiflazz fails.
    /// </summary>
    private async Task<ProviderOrderResponse> OrderViaVipResellerAsync(string sku, string targetId, string zoneId, string refId)
    {
        var apiKey = _configuration["VipReseller:ApiKey"];
        var apiId = _configuration["VipReseller:ApiId"];
        
        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiId))
        {
            return new ProviderOrderResponse { IsSuccess = false, Message = "VIP Reseller credentials not configured." };
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

                return new ProviderOrderResponse
                {
                    IsSuccess = true,
                    ProviderName = "VIP Reseller",
                    ProviderRef = trxId,
                    Sn = sn,
                    Message = "Success via VIP Reseller fallback."
                };
            }

            var errorMsg = content.TryGetProperty("message", out var msgProp) ? msgProp.GetString() : "Unknown error from VIP Reseller";
            return new ProviderOrderResponse { IsSuccess = false, Message = errorMsg };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "VIP Reseller API Exception");
            return new ProviderOrderResponse { IsSuccess = false, Message = "Connection to VIP Reseller failed." };
        }
    }

    private static string CreateMD5(string input)
    {
        using var md5 = MD5.Create();
        var inputBytes = Encoding.ASCII.GetBytes(input);
        var hashBytes = md5.ComputeHash(inputBytes);
        return Convert.ToHexString(hashBytes).ToLower();
    }
}

public class ProviderOrderResponse
{
    public bool IsSuccess { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string? ProviderRef { get; set; }
    public string? Sn { get; set; }
    public string? Message { get; set; }
}

public class ProviderBalanceResponse
{
    public bool IsSuccess { get; set; }
    public decimal Balance { get; set; }
    public string? Message { get; set; }
}

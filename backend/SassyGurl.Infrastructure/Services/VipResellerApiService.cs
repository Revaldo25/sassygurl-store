using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SassyGurl.Application.DTOs;
using SassyGurl.Application.Interfaces;

namespace SassyGurl.Infrastructure.Services;

/// <summary>
/// VIP Reseller API Integration.
/// </summary>
public class VipResellerApiService : IProviderApiService
{
    private readonly HttpClient _httpClient;
    private readonly IEncryptionService _encryptionService;
    private readonly IConfiguration _config;
    private readonly ILogger<VipResellerApiService> _logger;

    public string ProviderName => "VipReseller";

    public VipResellerApiService(
        IHttpClientFactory httpClientFactory,
        IEncryptionService encryptionService,
        IConfiguration config,
        ILogger<VipResellerApiService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("VipResellerClient");
        _encryptionService = encryptionService;
        _config = config;
        _logger = logger;
    }

    private (string ApiId, string ApiKey) GetCredentials()
    {
        var apiId = _config["ProviderApis:VipResellerApiId"];
        
        var encryptedKey = _config["ProviderApis:VipResellerApiKeyEncrypted"];
        var apiKey = string.IsNullOrWhiteSpace(encryptedKey) 
            ? _config["ProviderApis:VipResellerApiKey"] 
            : _encryptionService.Decrypt(encryptedKey);

        if (string.IsNullOrEmpty(apiId) || string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException("VIP Reseller credentials are not configured properly.");
        }

        return (apiId, apiKey);
    }

    private string GenerateSign(string apiId, string apiKey)
    {
        string rawSignature = $"{apiId}{apiKey}";
        using var md5 = MD5.Create();
        byte[] hashBytes = md5.ComputeHash(Encoding.UTF8.GetBytes(rawSignature));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    public async Task<decimal> GetBalanceAsync()
    {
        var creds = GetCredentials();
        var sign = GenerateSign(creds.ApiId, creds.ApiKey);

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("key", creds.ApiKey),
            new KeyValuePair<string, string>("sign", sign),
            new KeyValuePair<string, string>("type", "profile")
        });

        var response = await _httpClient.PostAsync("profile", content);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<VipProfileResponse>();
        return result?.Data?.Balance ?? 0m;
    }

    public async Task<List<ProviderProductDto>> GetProductsAsync()
    {
        var creds = GetCredentials();
        var sign = GenerateSign(creds.ApiId, creds.ApiKey);

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("key", creds.ApiKey),
            new KeyValuePair<string, string>("sign", sign),
            new KeyValuePair<string, string>("type", "services"),
            new KeyValuePair<string, string>("filter_type", "game")
        });

        var response = await _httpClient.PostAsync("game-feature", content);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<VipServiceResponse>();
        if (result?.Data == null) return new List<ProviderProductDto>();

        return result.Data.Select(p => new ProviderProductDto
        {
            Sku = p.Code ?? "",
            Name = p.Name ?? "",
            Category = "Game",
            Brand = p.Game ?? "",
            Price = p.Price?.Basic ?? 0m,
            IsActive = p.Status == "available",
            ProviderName = ProviderName
        }).ToList();
    }

    public async Task<ProviderOrderResponseDto> CreateOrderAsync(string sku, string customerTarget, string internalOrderId)
    {
        var creds = GetCredentials();
        var sign = GenerateSign(creds.ApiId, creds.ApiKey);

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("key", creds.ApiKey),
            new KeyValuePair<string, string>("sign", sign),
            new KeyValuePair<string, string>("type", "order"),
            new KeyValuePair<string, string>("service", sku),
            new KeyValuePair<string, string>("data_no", customerTarget)
        });

        var response = await _httpClient.PostAsync("game-feature", content);
        var responseString = await response.Content.ReadAsStringAsync();
        
        _logger.LogInformation("VIP Reseller order response: {Response}", responseString);

        // Simple JSON Parsing (Dynamic/Typed based on actual structure)
        var result = System.Text.Json.JsonSerializer.Deserialize<VipOrderResponse>(responseString, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (result == null || !result.Result)
        {
            return new ProviderOrderResponseDto
            {
                IsSuccess = false,
                Status = "Failed",
                Note = result?.Message ?? "Order failed at provider.",
                ProviderOrderId = internalOrderId
            };
        }

        return new ProviderOrderResponseDto
        {
            IsSuccess = true,
            Status = "Pending",
            Sn = "", // VIP Reseller returns trx id, sn might come from status check later
            Note = result.Message,
            ProviderOrderId = result.Data?.TrxId.ToString() ?? internalOrderId
        };
    }

    // --- VIP Reseller DTOs ---
    private class VipProfileResponse { public bool Result { get; set; } public VipProfileData? Data { get; set; } }
    private class VipProfileData { public decimal Balance { get; set; } }

    private class VipServiceResponse { public bool Result { get; set; } public List<VipServiceData>? Data { get; set; } }
    private class VipServiceData
    {
        public string? Code { get; set; }
        public string? Name { get; set; }
        public string? Game { get; set; }
        public VipPrice? Price { get; set; }
        public string? Status { get; set; }
    }
    private class VipPrice { public decimal Basic { get; set; } }

    private class VipOrderResponse { public bool Result { get; set; } public string? Message { get; set; } public VipOrderData? Data { get; set; } }
    private class VipOrderData { public int TrxId { get; set; } }
}

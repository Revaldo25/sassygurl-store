using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SassyGurl.Application.DTOs;
using SassyGurl.Application.Interfaces;

namespace SassyGurl.Infrastructure.Services;

/// <summary>
/// Digiflazz API Integration using HMAC-MD5 for Security.
/// </summary>
public class DigiflazzApiService : IProviderApiService
{
    private readonly HttpClient _httpClient;
    private readonly IEncryptionService _encryptionService;
    private readonly IConfiguration _config;
    private readonly ILogger<DigiflazzApiService> _logger;

    public string ProviderName => "Digiflazz";

    public DigiflazzApiService(
        IHttpClientFactory httpClientFactory,
        IEncryptionService encryptionService,
        IConfiguration config,
        ILogger<DigiflazzApiService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("DigiflazzClient");
        _encryptionService = encryptionService;
        _config = config;
        _logger = logger;
    }

    private (string Username, string ApiKey) GetCredentials()
    {
        var username = _config["ProviderApis:DigiflazzUsername"];
        
        // In a real app, API Keys are stored encrypted in the DB.
        // For simplicity here, we assume it's in the config, but we simulate decryption.
        var encryptedKey = _config["ProviderApis:DigiflazzApiKeyEncrypted"];
        var apiKey = string.IsNullOrWhiteSpace(encryptedKey) 
            ? _config["ProviderApis:DigiflazzApiKey"] 
            : _encryptionService.Decrypt(encryptedKey);

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException("Digiflazz credentials are not configured properly.");
        }

        return (username, apiKey);
    }

    private string GenerateSignature(string username, string apiKey, string command)
    {
        string rawSignature = $"{username}{apiKey}{command}";
        using var md5 = MD5.Create();
        byte[] hashBytes = md5.ComputeHash(Encoding.UTF8.GetBytes(rawSignature));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    public async Task<decimal> GetBalanceAsync()
    {
        var creds = GetCredentials();
        var sign = GenerateSignature(creds.Username, creds.ApiKey, "depo");

        var payload = new
        {
            cmd = "deposit",
            username = creds.Username,
            sign = sign
        };

        var response = await _httpClient.PostAsJsonAsync("cek-saldo", payload);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<DigiflazzBalanceResponse>();
        return result?.Data?.Deposit ?? 0m;
    }

    public async Task<List<ProviderProductDto>> GetProductsAsync()
    {
        var creds = GetCredentials();
        var sign = GenerateSignature(creds.Username, creds.ApiKey, "pricelist");

        var payload = new
        {
            cmd = "prepaid",
            username = creds.Username,
            sign = sign
        };

        var response = await _httpClient.PostAsJsonAsync("price-list", payload);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<DigiflazzPriceListResponse>();
        if (result?.Data == null) return new List<ProviderProductDto>();

        return result.Data.Select(p => new ProviderProductDto
        {
            Sku = p.BuyerSkuCode ?? "",
            Name = p.ProductName ?? "",
            Category = p.Category ?? "",
            Brand = p.Brand ?? "",
            Price = p.Price,
            IsActive = p.SellerProductStatus && p.BuyerProductStatus,
            ProviderName = ProviderName
        }).ToList();
    }

    public async Task<ProviderOrderResponseDto> CreateOrderAsync(string sku, string customerTarget, string internalOrderId)
    {
        var creds = GetCredentials();
        var sign = GenerateSignature(creds.Username, creds.ApiKey, internalOrderId);

        var payload = new
        {
            username = creds.Username,
            buyer_sku_code = sku,
            customer_no = customerTarget,
            ref_id = internalOrderId,
            sign = sign
        };

        var response = await _httpClient.PostAsJsonAsync("transaction", payload);
        var responseString = await response.Content.ReadAsStringAsync();
        
        _logger.LogInformation("Digiflazz order response: {Response}", responseString);

        var result = JsonSerializer.Deserialize<DigiflazzTransactionResponse>(responseString, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (result?.Data == null)
        {
            return new ProviderOrderResponseDto
            {
                IsSuccess = false,
                Status = "Failed",
                Note = "No data returned from provider.",
                ProviderOrderId = internalOrderId
            };
        }

        bool isSuccess = result.Data.Status == "Sukses" || result.Data.Status == "Pending";

        return new ProviderOrderResponseDto
        {
            IsSuccess = isSuccess,
            Status = result.Data.Status ?? "Unknown",
            Sn = result.Data.Sn,
            Note = result.Data.Message,
            ProviderOrderId = internalOrderId
        };
    }

    // --- DTOs specific to Digiflazz ---
    private class DigiflazzBalanceResponse { [JsonPropertyName("data")] public DigiflazzBalanceData? Data { get; set; } }
    private class DigiflazzBalanceData { [JsonPropertyName("deposit")] public decimal Deposit { get; set; } }

    private class DigiflazzPriceListResponse { [JsonPropertyName("data")] public List<DigiflazzProduct>? Data { get; set; } }
    private class DigiflazzProduct
    {
        [JsonPropertyName("buyer_sku_code")] public string? BuyerSkuCode { get; set; }
        [JsonPropertyName("product_name")] public string? ProductName { get; set; }
        [JsonPropertyName("category")] public string? Category { get; set; }
        [JsonPropertyName("brand")] public string? Brand { get; set; }
        [JsonPropertyName("price")] public decimal Price { get; set; }
        [JsonPropertyName("seller_product_status")] public bool SellerProductStatus { get; set; }
        [JsonPropertyName("buyer_product_status")] public bool BuyerProductStatus { get; set; }
    }

    private class DigiflazzTransactionResponse { [JsonPropertyName("data")] public DigiflazzTransactionData? Data { get; set; } }
    private class DigiflazzTransactionData
    {
        [JsonPropertyName("status")] public string? Status { get; set; }
        [JsonPropertyName("sn")] public string? Sn { get; set; }
        [JsonPropertyName("message")] public string? Message { get; set; }
    }
}

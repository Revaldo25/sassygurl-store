using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;

namespace SassyGurl.Api.Services;

// ============================================================================
// SYNC ENGINE — Full product synchronization from VIP Reseller + Digiflazz
// ============================================================================

/// <summary>
/// The "SyncEngine" orchestrates: Fetch → Price Engine → Asset Manager → Upsert
/// </summary>
public interface ISyncEngine
{
    /// <summary>Pull all products from VIP Reseller, compute prices, upsert to DB.</summary>
    Task<SyncResult> SyncFromVipResellerAsync();

    /// <summary>Pull all products from Digiflazz, compute prices, upsert to DB.</summary>
    Task<SyncResult> SyncFromDigiflazzAsync();

    /// <summary>Run both syncs sequentially.</summary>
    Task<SyncResult> SyncAllAsync();
}

public class SyncResult
{
    public int Created { get; set; }
    public int Updated { get; set; }
    public int Deactivated { get; set; }
    public int Errors { get; set; }
    public string Provider { get; set; } = "";
    public TimeSpan Duration { get; set; }
}

public class SyncEngine : ISyncEngine
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly SassyGurlDbContext _db;
    private readonly IConfiguration _config;
    private readonly ICloudinaryService _cloudinary;
    private readonly ILogger<SyncEngine> _logger;

    // ── Zone-ID dictionary — games that require Server/Zone ID ──────
    private static readonly HashSet<string> GamesRequiringZoneId = new(StringComparer.OrdinalIgnoreCase)
    {
        "mobile-legends", "mobile legends", "ml",
        "genshin-impact", "genshin impact",
        "honkai-star-rail", "honkai star rail"
    };

    // ── Phase 2: Category Classification Dictionary ──────────────────
    // Maps Digiflazz category strings to our internal category slugs
    private static readonly Dictionary<string, string> CategoryMap = new(StringComparer.OrdinalIgnoreCase)
    {
        // Games
        { "Games", "games" }, { "Voucher", "games" },
        // Pulsa & Data
        { "Pulsa", "pulsa" }, { "Data", "pulsa" }, { "SMS & Telepon", "pulsa" },
        // E-Wallet & Bill
        { "E-Money", "e-wallet" }, { "PLN", "e-wallet" }, { "BPJS", "e-wallet" },
        { "Pascabayar", "e-wallet" }, { "TV", "e-wallet" }, { "Streaming", "e-wallet" }
    };

    private static string ResolveCategorySlug(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return "games";
        return CategoryMap.TryGetValue(category, out var slug) ? slug : "games";
    }

    // ── Brand Normalizer (Maps Provider Game/Brand to DB Slug) ──────
    private static string? NormalizeBrandToSlug(string brand)
    {
        if (string.IsNullOrWhiteSpace(brand)) return null;
        
        var normalized = brand.ToLowerInvariant().Replace(" ", "");
        return normalized switch
        {
            "mobilelegends" => "mlbb",
            "mobilelegendsbangbang" => "mlbb",
            "freefire" => "ff",
            "genshinimpact" => "genshin",
            "honkaistarrail" => "hsr",
            "zenlesszonezero" => "zzz",
            "wutheringwaves" => "wuwa",
            "pubgmobile" => "pubg",
            "valorant" => "valorant",
            "honorofkings" => "hok",
            "goddessofvictorynikke" => "nikke",
            "nikke" => "nikke",
            "leagueoflegends" => "lol",
            "wildrift" => "wr",
            "leagueoflegendswildrift" => "wr",
            "roblox" => "roblox",
            "aethergazer" => "aether",
            "magicchess" => "mccg",
            _ => null
        };
    }

    public SyncEngine(
        IHttpClientFactory httpClientFactory,
        SassyGurlDbContext db,
        IConfiguration config,
        ICloudinaryService cloudinary,
        ILogger<SyncEngine> logger)
    {
        _httpClientFactory = httpClientFactory;
        _db = db;
        _config = config;
        _cloudinary = cloudinary;
        _logger = logger;
    }

    // ====================================================================
    // 1. SYNC FROM VIP RESELLER
    // ====================================================================
    public async Task<SyncResult> SyncFromVipResellerAsync()
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var result = new SyncResult { Provider = "VipReseller" };

        try
        {
            var apiKey = _config["VipReseller:ApiKey"];
            var apiId = _config["VipReseller:ApiId"];
            if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiId))
            {
                _logger.LogWarning("VIP Reseller credentials not configured. Skipping sync.");
                return result;
            }

            var sign = CreateMD5($"{apiId}{apiKey}");
            var client = _httpClientFactory.CreateClient("VipResellerClient");

            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("key", apiKey),
                new KeyValuePair<string, string>("sign", sign),
                new KeyValuePair<string, string>("type", "services"),
                new KeyValuePair<string, string>("filter_type", "game")
            });

            var response = await client.PostAsync("game-feature", content);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadFromJsonAsync<VipServiceListResponse>();
            if (json?.Data == null || !json.Result)
            {
                _logger.LogWarning("VIP Reseller returned empty or failed response.");
                return result;
            }

            _logger.LogInformation("Fetched {Count} products from VIP Reseller.", json.Data.Count);

            foreach (var item in json.Data)
            {
                try
                {
                    var brand = item.Game ?? "";
                    var targetGameSlug = NormalizeBrandToSlug(brand);
                    if (targetGameSlug == null)
                    {
                        _logger.LogWarning("Category for brand [{Brand}] not found (VIP Reseller)", brand);
                        continue;
                    }

                    await UpsertProductAsync(
                        sku: item.Code ?? "",
                        name: item.Name ?? "",
                        gameSlug: targetGameSlug,
                        categorySlug: "games", // VIP Reseller is game-only provider
                        basePrice: item.Price?.Basic ?? 0,
                        source: ProviderSource.VIP,
                        isActive: item.Status == "available",
                        result);
                }
                catch (Exception ex)
                {
                    result.Errors++;
                    _logger.LogError(ex, "Error syncing VIP product {Sku}", item.Code);
                }
            }

            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "VIP Reseller sync failed globally.");
            result.Errors++;
        }

        sw.Stop();
        result.Duration = sw.Elapsed;
        _logger.LogInformation("VIP Reseller sync done: Created={C}, Updated={U}, Errors={E}, Duration={D}ms",
            result.Created, result.Updated, result.Errors, result.Duration.TotalMilliseconds);
        return result;
    }

    // ====================================================================
    // 2. SYNC FROM DIGIFLAZZ
    // ====================================================================
    public async Task<SyncResult> SyncFromDigiflazzAsync()
    {
        _logger.LogInformation("Mulai Sync...");
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var result = new SyncResult { Provider = "Digiflazz" };

        try
        {
            var username = _config["Digiflazz:Username"];
            var apiKey = _config["Digiflazz:ApiKey"];
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("Digiflazz credentials not configured. Skipping sync.");
                return result;
            }

            _logger.LogInformation("Kunci ditemukan: {User}", username);

            var sign = CreateMD5($"{username}{apiKey}pricelist");
            var client = _httpClientFactory.CreateClient("DigiflazzClient");

            var payload = new { cmd = "prepaid", username, sign };
            _logger.LogInformation("Digiflazz request payload: cmd=prepaid, username={User}, sign={Sign}", username, sign);

            _logger.LogInformation("Mulai panggil HttpClient...");
            // POST to price-list
            var response = await client.PostAsJsonAsync("price-list", payload);

            // ── LOG RAW RESPONSE (critical for debugging Invalid Key / IP errors) ──
            var rawBody = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Digiflazz raw response (HTTP {StatusCode}): {Body}",
                (int)response.StatusCode, rawBody.Length > 2000 ? rawBody[..2000] + "... (truncated)" : rawBody);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Digiflazz returned HTTP {StatusCode}. Body: {Body}", (int)response.StatusCode, rawBody);
                result.Errors++;
                return result;
            }

            var json = System.Text.Json.JsonSerializer.Deserialize<DigiflazzPriceListResponse>(rawBody);
            if (json?.Data == null)
            {
                _logger.LogWarning("Digiflazz returned empty/null data. Full body: {Body}", rawBody);
                return result;
            }

            _logger.LogInformation("Fetched {Count} products from Digiflazz.", json.Data.Count);


            foreach (var item in json.Data)
            {
                try
                {
                    bool isActive = item.SellerProductStatus && item.BuyerProductStatus;
                    var categorySlug = ResolveCategorySlug(item.Category);
                    var brand = item.Brand ?? "";
                    
                    var targetGameSlug = NormalizeBrandToSlug(brand);
                    if (targetGameSlug == null)
                    {
                        _logger.LogWarning("Category for brand [{Brand}] not found", brand);
                        continue;
                    }

                    await UpsertProductAsync(
                        sku: item.BuyerSkuCode ?? "",
                        name: item.ProductName ?? "",
                        gameSlug: targetGameSlug,
                        categorySlug: categorySlug,
                        basePrice: item.Price,
                        source: ProviderSource.DIGIFLAZZ,
                        isActive: isActive,
                        result);
                }
                catch (Exception ex)
                {
                    result.Errors++;
                    _logger.LogError(ex, "Error syncing Digiflazz product {Sku}", item.BuyerSkuCode);
                }
            }

            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Digiflazz sync failed globally.");
            result.Errors++;
        }

        sw.Stop();
        result.Duration = sw.Elapsed;
        _logger.LogInformation("Digiflazz sync done: Created={C}, Updated={U}, Errors={E}, Duration={D}ms",
            result.Created, result.Updated, result.Errors, result.Duration.TotalMilliseconds);
        return result;
    }

    public async Task<SyncResult> SyncAllAsync()
    {
        var r1 = await SyncFromVipResellerAsync();
        var r2 = await SyncFromDigiflazzAsync();
        return new SyncResult
        {
            Provider = "ALL",
            Created = r1.Created + r2.Created,
            Updated = r1.Updated + r2.Updated,
            Errors = r1.Errors + r2.Errors,
            Duration = r1.Duration + r2.Duration
        };
    }

    // ====================================================================
    // CORE: UPSERT LOGIC + PRICE ENGINE + ASSET MANAGER
    // ====================================================================
    // ── Category display name mapping ────────────────────────────────
    private static readonly Dictionary<string, string> CategoryDisplayNames = new()
    {
        { "games", "Games" },
        { "pulsa", "Pulsa & Data" },
        { "e-wallet", "E-Wallet & Tagihan" }
    };

    private async Task UpsertProductAsync(
        string sku, string name, string gameSlug,
        string categorySlug,
        decimal basePrice, ProviderSource source, bool isActive,
        SyncResult result)
    {
        if (string.IsNullOrWhiteSpace(sku)) return;

        // ── Phase 2: Resolve Category (Games / Pulsa / E-Wallet) ─
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Slug == categorySlug);
        if (category == null)
        {
            var displayName = CategoryDisplayNames.GetValueOrDefault(categorySlug, "Games");
            category = new Category { Name = displayName, Slug = categorySlug };
            _db.Categories.Add(category);
            await _db.SaveChangesAsync();
        }

        // ── Resolve Game entity (Strict match by Slug) ─────────────────────────
        var game = await _db.Games.FirstOrDefaultAsync(g => g.Slug == gameSlug);
        if (game == null)
        {
            _logger.LogWarning("Game with slug {Slug} not found in DB. Skipping product {Sku}.", gameSlug, sku);
            return;
        }

        // ── Resolve or create Provider entity ──────────────────────────
        var providerName = source == ProviderSource.VIP ? "VIP Reseller" : "Digiflazz";
        var provider = await _db.Providers.FirstOrDefaultAsync(p => p.Name == providerName);
        if (provider == null)
        {
            provider = new Provider { Name = providerName };
            _db.Providers.Add(provider);
            await _db.SaveChangesAsync();
        }

        // ── Price Engine ───────────────────────────────────────────────
        decimal marginPercent = _config.GetValue<decimal>("Pricing:MarginPercentage", 0.05m);
        decimal fixedFee = _config.GetValue<decimal>("Pricing:FixedFee", 0m);
        decimal salePrice = basePrice + (basePrice * marginPercent) + fixedFee;

        // ── Build metadata JSONB ───────────────────────────────────────
        bool gameNeedsZone = game.HasServerId;
        var metadata = JsonSerializer.Serialize(new { needsZoneId = gameNeedsZone });

        // ── Upsert ─────────────────────────────────────────────────────
        var existing = await _db.Products.FirstOrDefaultAsync(p => p.Sku == sku);

        if (existing != null)
        {
            // UPDATE: only touch price fields + active status
            existing.PriceModal = basePrice;
            existing.PriceSell = salePrice;
            existing.PriceMember = salePrice * 0.98m;
            existing.PriceReseller = salePrice * 0.95m;
            existing.PriceVip = salePrice * 0.90m;
            existing.IsActive = isActive;
            existing.Metadata = metadata;
            existing.LastSyncedAt = DateTime.UtcNow;
            result.Updated++;
        }
        else
        {
            // CREATE: new product
            // We use the game slug to fetch the placeholder image name, 
            // since we removed `gameName` parameter.
            string? imageUrl = null;
            try
            {
                imageUrl = await _cloudinary.UploadPlaceholderAsync(game.Name, sku);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Cloudinary upload failed for {Sku}. Using null ImageUrl.", sku);
            }

            var product = new Product
            {
                GameId = game.Id,
                ProviderId = provider.Id,
                Sku = sku,
                Name = name,
                Source = source,
                ImageUrl = imageUrl,
                Metadata = metadata,
                PriceModal = basePrice,
                PriceSell = salePrice,
                PriceMember = salePrice * 0.98m,
                PriceReseller = salePrice * 0.95m,
                PriceVip = salePrice * 0.90m,
                IsActive = isActive,
                LastSyncedAt = DateTime.UtcNow
            };
            _db.Products.Add(product);
            result.Created++;
        }
    }

    private static string CreateMD5(string input)
    {
        using var md5 = MD5.Create();
        byte[] hash = md5.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    // ── VIP Reseller DTOs ──────────────────────────────────────────────
    private class VipServiceListResponse
    {
        [JsonPropertyName("result")] public bool Result { get; set; }
        [JsonPropertyName("data")] public List<VipServiceItem>? Data { get; set; }
    }
    private class VipServiceItem
    {
        [JsonPropertyName("code")] public string? Code { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("game")] public string? Game { get; set; }
        [JsonPropertyName("status")] public string? Status { get; set; }
        [JsonPropertyName("price")] public VipPriceInfo? Price { get; set; }
    }
    private class VipPriceInfo
    {
        [JsonPropertyName("basic")] public decimal Basic { get; set; }
    }

    // ── Digiflazz DTOs ─────────────────────────────────────────────────
    private class DigiflazzPriceListResponse
    {
        [JsonPropertyName("data")] public List<DigiflazzProduct>? Data { get; set; }
    }
    private class DigiflazzProduct
    {
        [JsonPropertyName("buyer_sku_code")] public string? BuyerSkuCode { get; set; }
        [JsonPropertyName("product_name")] public string? ProductName { get; set; }
        [JsonPropertyName("category")] public string? Category { get; set; }
        [JsonPropertyName("brand")] public string? Brand { get; set; }
        [JsonPropertyName("type")] public string? Type { get; set; }
        [JsonPropertyName("price")] public decimal Price { get; set; }
        [JsonPropertyName("seller_product_status")] public bool SellerProductStatus { get; set; }
        [JsonPropertyName("buyer_product_status")] public bool BuyerProductStatus { get; set; }
    }
}

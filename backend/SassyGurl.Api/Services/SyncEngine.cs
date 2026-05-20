using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
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
    private readonly IMemoryCache _cache;
    private readonly ICacheKeyRegistry _cacheRegistry;

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
        ILogger<SyncEngine> logger,
        IMemoryCache cache,
        ICacheKeyRegistry cacheRegistry)
    {
        _httpClientFactory = httpClientFactory;
        _db = db;
        _config = config;
        _cloudinary = cloudinary;
        _logger = logger;
        _cache = cache;
        _cacheRegistry = cacheRegistry;
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
            var rawBody = await response.Content.ReadAsStringAsync();
            sw.Stop();

            // ── Master Plan §5.1: Store raw provider response ────────────────
            var syncLog = new Models.ProviderSyncLog
            {
                ProviderName = "VipReseller",
                Operation = "game-feature",
                RequestPayload = JsonSerializer.Serialize(new { apiId, type = "services", filter_type = "game" }),
                ResponseBody = rawBody.Length > 500_000 ? rawBody[..500_000] + "... (truncated)" : rawBody,
                HttpStatus = (int)response.StatusCode,
                DurationMs = (int)sw.ElapsedMilliseconds
            };

            if (!response.IsSuccessStatusCode)
            {
                syncLog.ErrorMessage = $"HTTP {(int)response.StatusCode}";
                _db.ProviderSyncLogs.Add(syncLog);
                await _db.SaveChangesAsync();
                _logger.LogError("VIP Reseller returned HTTP {StatusCode}.", (int)response.StatusCode);
                result.Errors++;
                return result;
            }

            var json = JsonSerializer.Deserialize<VipServiceListResponse>(rawBody);
            if (json?.Data == null || !json.Result)
            {
                syncLog.ErrorMessage = "Empty or failed response";
                _db.ProviderSyncLogs.Add(syncLog);
                await _db.SaveChangesAsync();
                _logger.LogWarning("VIP Reseller returned empty or failed response.");
                return result;
            }

            syncLog.ItemCount = json.Data.Count;
            _logger.LogInformation("Fetched {Count} products from VIP Reseller.", json.Data.Count);

            int unmappedCount = 0;

            foreach (var item in json.Data)
            {
                try
                {
                    var brand = item.Game ?? "";
                    var targetGameSlug = NormalizeBrandToSlug(brand);

                    // Master Plan §6.4: Don't auto-create games for unmapped brands.
                    if (targetGameSlug == null)
                    {
                        unmappedCount++;
                        if (unmappedCount <= 10)
                        {
                            _logger.LogDebug("VIP: Skipping unmapped brand: {Brand}, SKU: {Sku}", brand, item.Code);
                        }
                        continue;
                    }

                    await UpsertProductAsync(
                        sku: item.Code ?? "",
                        originalName: item.Name ?? "",
                        gameSlug: targetGameSlug,
                        categorySlug: "games",
                        subCategory: "games",
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

            if (unmappedCount > 0)
            {
                _logger.LogInformation("VIP: Skipped {Count} products from unmapped brands (total).", unmappedCount);
            }

            syncLog.ErrorCount = result.Errors;
            _db.ProviderSyncLogs.Add(syncLog);
            await _db.SaveChangesAsync();

            // ── Master Plan §7.9: Invalidate catalog cache after successful sync ──
            InvalidateCatalogCache();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "VIP Reseller sync failed globally.");
            result.Errors++;
        }

        if (!sw.IsRunning) sw.Start();
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
            var response = await client.PostAsJsonAsync("price-list", payload);

            var rawBody = await response.Content.ReadAsStringAsync();
            sw.Stop(); // Measure duration up to response received

            // ── Master Plan §5.1: Store raw provider response ────────────────
            var syncLog = new Models.ProviderSyncLog
            {
                ProviderName = "Digiflazz",
                Operation = "pricelist",
                RequestPayload = System.Text.Json.JsonSerializer.Serialize(payload),
                ResponseBody = rawBody.Length > 500_000 ? rawBody[..500_000] + "... (truncated)" : rawBody,
                HttpStatus = (int)response.StatusCode,
                DurationMs = (int)sw.ElapsedMilliseconds
            };

            _logger.LogInformation("Digiflazz raw response (HTTP {StatusCode}): {BodyLength} bytes",
                (int)response.StatusCode, rawBody.Length);

            if (!response.IsSuccessStatusCode)
            {
                syncLog.ErrorMessage = $"HTTP {(int)response.StatusCode}";
                _db.ProviderSyncLogs.Add(syncLog);
                await _db.SaveChangesAsync();

                _logger.LogError("Digiflazz returned HTTP {StatusCode}.", (int)response.StatusCode);
                result.Errors++;
                return result;
            }

            var json = System.Text.Json.JsonSerializer.Deserialize<DigiflazzPriceListResponse>(rawBody);
            if (json?.Data == null)
            {
                syncLog.ErrorMessage = "Empty/null data in response";
                _db.ProviderSyncLogs.Add(syncLog);
                await _db.SaveChangesAsync();

                _logger.LogWarning("Digiflazz returned empty/null data.");
                return result;
            }

            syncLog.ItemCount = json.Data.Count;
            _logger.LogInformation("Fetched {Count} products from Digiflazz.", json.Data.Count);

            int unmappedCount = 0;

            foreach (var item in json.Data)
            {
                try
                {
                    bool isActive = item.SellerProductStatus && item.BuyerProductStatus;
                    var categorySlug = ResolveCategorySlug(item.Category);
                    var brand = item.Brand ?? "";
                    
                    var targetGameSlug = NormalizeBrandToSlug(brand);

                    // Master Plan §6.4: Don't auto-create games for unmapped brands.
                    // Log the unmapped brand and skip.
                    if (targetGameSlug == null)
                    {
                        unmappedCount++;
                        // Only log first 10 to avoid log spam during large syncs
                        if (unmappedCount <= 10)
                        {
                            _logger.LogDebug("Skipping unmapped brand: {Brand}, SKU: {Sku}, Category: {Category}",
                                brand, item.BuyerSkuCode, item.Category);
                        }
                        continue;
                    }

                    var subCategory = item.Type ?? categorySlug;

                    await UpsertProductAsync(
                        sku: item.BuyerSkuCode ?? "",
                        originalName: item.ProductName ?? "",
                        gameSlug: targetGameSlug,
                        categorySlug: categorySlug,
                        subCategory: subCategory,
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

            if (unmappedCount > 0)
            {
                _logger.LogInformation("Skipped {Count} products from unmapped brands (total).", unmappedCount);
            }

            syncLog.ErrorCount = result.Errors;
            _db.ProviderSyncLogs.Add(syncLog);
            await _db.SaveChangesAsync();

            // ── Master Plan §7.9: Invalidate catalog cache after successful sync ──
            InvalidateCatalogCache();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Digiflazz sync failed globally.");
            result.Errors++;
        }

        if (!sw.IsRunning) sw.Start(); // Restart if stopped early
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

    private static string CleanProductName(string name)
    {
        // Universal Data Sanitizer
        name = System.Text.RegularExpressions.Regex.Replace(name, @"\s*\(.*?\)\s*", " ");
        name = System.Text.RegularExpressions.Regex.Replace(name, @"\s*\[.*?\]\s*", " ");
        int plusIndex = name.IndexOf('+');
        if (plusIndex >= 0) name = name.Substring(0, plusIndex);
        return name.Trim();
    }

    private static string ExtractNominal(string sku, string name)
    {
        // Smart Nominal Extractor
        var match = System.Text.RegularExpressions.Regex.Match(name, @"\d+");
        if (!match.Success) match = System.Text.RegularExpressions.Regex.Match(sku, @"\d+");
        return match.Success ? match.Value : "0";
    }

    private static string GetCurrencyName(string gameSlug)
    {
        return gameSlug switch
        {
            "mlbb" => "Diamonds",
            "ff" => "Diamonds",
            "genshin" => "Genesis Crystals",
            "hsr" => "Oneiric Shards",
            "pubg" => "UC",
            "valorant" => "Points",
            "hok" => "Tokens",
            "aether" => "Shifted Stars",
            _ => "Items"
        };
    }

    private async Task UpsertProductAsync(
        string sku, string originalName, string gameSlug,
        string categorySlug, string subCategory,
        decimal basePrice, ProviderSource source, bool isActive,
        SyncResult result)
    {
        if (string.IsNullOrWhiteSpace(sku)) return;

        // Auto-Input Detection
        bool isServerNeeded = originalName.Contains("Server", StringComparison.OrdinalIgnoreCase) || 
                              originalName.Contains("Zone", StringComparison.OrdinalIgnoreCase) || 
                              originalName.Contains("Region", StringComparison.OrdinalIgnoreCase);

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
            _logger.LogInformation("Creating new inactive game for unmapped brand: {Slug}", gameSlug);
            game = new Game 
            { 
                Name = gameSlug.Replace("-", " ").ToUpper(), 
                Slug = gameSlug, 
                CategoryId = category.Id, 
                IsActive = false 
            };
            _db.Games.Add(game);
            await _db.SaveChangesAsync();
        }

        if (isServerNeeded && !game.HasServerId)
        {
            game.HasServerId = true;
            _db.Games.Update(game);
        }

        string cleanName = CleanProductName(originalName);
        string nominal = ExtractNominal(sku, originalName);
        string standardName = $"{nominal} {GetCurrencyName(gameSlug)}";
        if (nominal == "0") standardName = cleanName;

        // ── Construct Image URL ────────────────────────────────────────
        string safeSubCategory = subCategory.ToLowerInvariant().Replace(" ", "-");
        string safeNominal = nominal.ToLowerInvariant().Replace(" ", "-");
        string imageUrl = $"/images/items/{gameSlug}/{safeSubCategory}/{safeNominal}.png";

        // ── Resolve or create Provider entity ──────────────────────────
        var providerName = source == ProviderSource.VIP ? "VIP Reseller" : "Digiflazz";
        var provider = await _db.Providers.FirstOrDefaultAsync(p => p.Name == providerName);
        if (provider == null)
        {
            provider = new Provider { Name = providerName };
            _db.Providers.Add(provider);
            await _db.SaveChangesAsync();
        }

        // ── Dynamic Pricing Sultan ───────────────────────────────────────────
        decimal marginPercent = _config.GetValue<decimal>("Pricing:MarginPercentage", 0.03m); // 3% margin
        
        // Harga Jual = CEILING((Harga Modal * (1 + Margin)) / 100) * 100
        decimal rawSalePrice = basePrice * (1m + marginPercent);
        decimal salePrice = Math.Ceiling(rawSalePrice / 100m) * 100m;
        
        // Harga Coret (OriginalPrice) = Harga Jual * 1.15
        decimal margin = salePrice - basePrice;
        decimal originalPrice = salePrice * 1.15m;

        // ── Build metadata JSONB ───────────────────────────────────────
        bool gameNeedsZone = game.HasServerId;
        var metadata = JsonSerializer.Serialize(new { needsZoneId = gameNeedsZone });

        // ── Multi-Provider Price War ───────────────────────────────────
        var existing = await _db.Products.FirstOrDefaultAsync(p => p.Name == standardName && p.GameId == game.Id);

        if (existing != null)
        {
            // Update logic: If new basePrice is cheaper OR it's from the same provider, update.
            if (basePrice < existing.PriceModal || existing.ProviderId == provider.Id)
            {
                existing.Sku = sku;
                existing.ProviderId = provider.Id;
                existing.Source = source;
                existing.OriginalName = originalName;
                existing.CleanName = cleanName;
                existing.PriceModal = basePrice;
                existing.Margin = margin;
                existing.PriceSell = salePrice;
                existing.OriginalPrice = originalPrice;
                existing.PriceMember = salePrice * 0.98m;
                existing.PriceReseller = salePrice * 0.95m;
                existing.PriceVip = salePrice * 0.90m;
                existing.IsActive = isActive;
                existing.Metadata = metadata;
                existing.ImageUrl = imageUrl;
                existing.LastSyncedAt = DateTime.UtcNow;
                result.Updated++;
            }
            else
            {
                // New price is more expensive from a different provider -> Keep existing active, ignore new.
                // Or if we were syncing multiple products, we'd set the more expensive one to IsActive = false, 
                // but since we only keep 1 record per "standardName", we just don't update it.
                existing.LastSyncedAt = DateTime.UtcNow;
            }
        }
        else
        {
            // CREATE: new product
            var product = new Product
            {
                GameId = game.Id,
                ProviderId = provider.Id,
                Sku = sku,
                Name = standardName,
                OriginalName = originalName,
                CleanName = cleanName,
                Source = source,
                ImageUrl = imageUrl,
                Metadata = metadata,
                PriceModal = basePrice,
                Margin = margin,
                PriceSell = salePrice,
                OriginalPrice = originalPrice,
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

    /// <summary>
    /// Invalidates catalog cache after sync so fresh data is served.
    /// Master Plan §7 step 9: "Cache di-refresh"
    /// </summary>
    private void InvalidateCatalogCache()
    {
        _cache.Remove("catalog:games");
        
        // Remove dynamic game detail caches tracked by the registry
        var keys = _cacheRegistry.GetAllGameCacheKeys();
        foreach (var key in keys)
        {
            _cache.Remove(key);
        }
        _cacheRegistry.ClearGameCacheKeys();

        _logger.LogInformation("Catalog cache invalidated after sync. Removed {Count} dynamic game detail keys.", keys.Count());
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

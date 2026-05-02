using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Catalog;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Services;

public interface ICatalogService
{
    Task<ApiResponse<List<GameDto>>> GetAllGamesAsync();
    Task<ApiResponse<GameDetailDto>> GetGameWithProductsAsync(string slug, string userRole = "MEMBER");
    Task<ApiResponse<List<PaymentMethodDto>>> GetActivePaymentMethodsAsync();
    Task<ApiResponse<List<PaymentGroupDto>>> GetGroupedPaymentMethodsAsync();
    Task<ApiResponse<List<ProviderStatusDto>>> GetProviderStatusesAsync();
}

public class CatalogService : ICatalogService
{
    private readonly SassyGurlDbContext _context;
    private readonly IMemoryCache _cache;

    // Cache durations (memory-efficient: short TTL, no stale data risk)
    private static readonly TimeSpan GamesListTtl    = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan GameDetailTtl   = TimeSpan.FromMinutes(3);
    private static readonly TimeSpan PaymentsTtl     = TimeSpan.FromMinutes(10);

    public CatalogService(SassyGurlDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache   = cache;
    }

    // ════════════════════════════════════════════════════════
    // GET ALL GAMES
    // ════════════════════════════════════════════════════════

    public async Task<ApiResponse<List<GameDto>>> GetAllGamesAsync()
    {
        if (_cache.TryGetValue("catalog:games", out List<GameDto>? cached) && cached is not null)
            return ApiResponse<List<GameDto>>.Ok(cached);

        var games = await _context.Games
            .AsNoTracking()
            .Where(g => g.IsActive)
            .OrderBy(g => g.SortOrder)
            .Select(g => new GameDto
            {
                Id            = g.Id,
                Name          = g.Name,
                Slug          = g.Slug,
                Publisher     = g.Publisher,
                Thumbnail     = ResolveAsset(g.Thumbnail, g.Slug, "icon"),
                Banner        = ResolveAsset(g.Banner,    g.Slug, "banner"),
                GuideImage    = g.GuideImage,
                HasServerId   = g.HasServerId,
                ServerOptions = g.ServerOptions,
                IsHot         = g.IsHot,
                CurrencyName  = InferCurrencyName(g.Name)
            })
            .ToListAsync();

        _cache.Set("catalog:games", games, GamesListTtl);
        return ApiResponse<List<GameDto>>.Ok(games);
    }

    // ════════════════════════════════════════════════════════
    // GET GAME DETAIL WITH GROUPED PRODUCTS
    // ════════════════════════════════════════════════════════

    public async Task<ApiResponse<GameDetailDto>> GetGameWithProductsAsync(string slug, string userRole = "MEMBER")
    {
        var cacheKey = $"catalog:game:{slug}:{userRole}";
        if (_cache.TryGetValue(cacheKey, out GameDetailDto? cached) && cached is not null)
            return ApiResponse<GameDetailDto>.Ok(cached);

        var game = await _context.Games
            .AsNoTracking()
            .Include(g => g.Products.Where(p => p.IsActive))
                .ThenInclude(p => p.Provider)
            .FirstOrDefaultAsync(g => g.Slug == slug && g.IsActive);

        if (game is null)
            return ApiResponse<GameDetailDto>.Fail("Game tidak ditemukan.");

        // Map products → DTOs with category detection
        var productDtos = game.Products
            .OrderBy(p => GetEffectivePrice(p, userRole))
            .Select(p =>
            {
                var price    = GetEffectivePrice(p, userRole);
                var origPrice = p.OriginalPrice ?? (p.PriceSell > 0 ? p.PriceSell : p.PriceMember);
                var cat      = ClassifyProduct(p.Name, p.Description);

                return new ProductDto
                {
                    Id                 = p.Id,
                    Sku                = p.Sku,
                    Name               = p.Name,
                    ItemCategory       = cat.Slug,
                    ItemCategoryLabel  = cat.Label,
                    ItemCategoryIcon   = cat.Icon,
                    Thumbnail          = ResolveProductThumbnail(p.Sku, slug),
                    Price              = price,
                    OriginalPrice      = origPrice > price ? origPrice : null,
                    IsFlashSale        = p.IsFlashSale,
                    Stock              = p.Stock,
                    SortOrder          = cat.SortOrder * 10000 + (int)(price),
                    DiscountPercent    = origPrice > price && origPrice > 0
                        ? (int)Math.Round((origPrice - price) / origPrice * 100)
                        : 0
                };
            })
            .OrderBy(p => p.SortOrder)
            .ToList();

        // Build grouped structure
        var grouped = productDtos
            .GroupBy(p => p.ItemCategory)
            .OrderBy(g => CategorySortOrder(g.Key))
            .Select(g => new GroupedProductsDto
            {
                Category = new ItemCategoryDto
                {
                    Slug      = g.Key,
                    Label     = g.First().ItemCategoryLabel,
                    Icon      = g.First().ItemCategoryIcon,
                    ItemCount = g.Count(),
                    SortOrder = CategorySortOrder(g.Key)
                },
                Items = g.OrderBy(p => p.Price).ToList()
            })
            .ToList();

        var itemCategories = grouped.Select(g => g.Category).ToList();

        var dto = new GameDetailDto
        {
            Id              = game.Id,
            Name            = game.Name,
            Slug            = game.Slug,
            Publisher       = game.Publisher,
            Thumbnail       = ResolveAsset(game.Thumbnail, game.Slug, "icon"),
            Banner          = ResolveAsset(game.Banner,    game.Slug, "banner"),
            GuideImage      = game.GuideImage,
            HasServerId     = game.HasServerId,
            ServerOptions   = game.ServerOptions,
            IsHot           = game.IsHot,
            CurrencyName    = InferCurrencyName(game.Name),
            ItemCategories  = itemCategories,
            GroupedProducts = grouped,
            Products        = productDtos   // flat list for backward compat
        };

        _cache.Set(cacheKey, dto, GameDetailTtl);
        return ApiResponse<GameDetailDto>.Ok(dto);
    }

    // ════════════════════════════════════════════════════════
    // PAYMENT METHODS — flat
    // ════════════════════════════════════════════════════════

    public async Task<ApiResponse<List<PaymentMethodDto>>> GetActivePaymentMethodsAsync()
    {
        if (_cache.TryGetValue("catalog:payments:flat", out List<PaymentMethodDto>? flat) && flat is not null)
            return ApiResponse<List<PaymentMethodDto>>.Ok(flat);

        var payments = await _context.PaymentMethods
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .ToListAsync();

        var dtos = payments.Select(p => MapPaymentDto(p)).ToList();

        _cache.Set("catalog:payments:flat", dtos, PaymentsTtl);
        return ApiResponse<List<PaymentMethodDto>>.Ok(dtos);
    }

    // ════════════════════════════════════════════════════════
    // PAYMENT METHODS — grouped (Ditusi accordion)
    // ════════════════════════════════════════════════════════

    public async Task<ApiResponse<List<PaymentGroupDto>>> GetGroupedPaymentMethodsAsync()
    {
        if (_cache.TryGetValue("catalog:payments:grouped", out List<PaymentGroupDto>? groupedCached) && groupedCached is not null)
            return ApiResponse<List<PaymentGroupDto>>.Ok(groupedCached);

        var payments = await _context.PaymentMethods
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .ToListAsync();

        var grouped = payments
            .GroupBy(p => p.Type.ToString())
            .OrderBy(g => PaymentGroupSortOrder(g.Key))
            .Select(g =>
            {
                var (label, flag) = PaymentGroupMeta(g.Key);
                return new PaymentGroupDto
                {
                    GroupKey   = g.Key,
                    GroupLabel = label,
                    CountryFlag= flag,
                    SortOrder  = PaymentGroupSortOrder(g.Key),
                    Methods    = g.Select(p => MapPaymentDto(p)).ToList()
                };
            })
            .ToList();

        _cache.Set("catalog:payments:grouped", grouped, PaymentsTtl);
        return ApiResponse<List<PaymentGroupDto>>.Ok(grouped);
    }

    // ════════════════════════════════════════════════════════
    // PROVIDERS
    // ════════════════════════════════════════════════════════

    public async Task<ApiResponse<List<ProviderStatusDto>>> GetProviderStatusesAsync()
    {
        var providers = await _context.Providers
            .AsNoTracking()
            .Select(p => new ProviderStatusDto
            {
                Name        = p.Name,
                IsActive    = p.IsActive,
                SuccessRate = p.SuccessRate,
                AvgLatency  = p.AvgLatencyMs,
                LastChecked = DateTime.UtcNow
            })
            .ToListAsync();

        return ApiResponse<List<ProviderStatusDto>>.Ok(providers);
    }

    // ════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════════════════

    private static PaymentMethodDto MapPaymentDto(Models.PaymentMethod p) => new()
    {
        Id         = p.Id,
        Code       = p.Code,
        Name       = p.Name,
        Type       = p.Type.ToString(),
        Logo       = p.Logo,
        FeeFlat    = p.FeeFlat,
        FeePercent = p.FeePercent,
        SortOrder  = p.SortOrder
    };

    /// <summary>
    /// Resolves asset URL from stored path or derives it from slug.
    /// Priority: stored URL → slug-based convention → null.
    /// </summary>
    private static string? ResolveAsset(string? stored, string slug, string assetType)
    {
        if (!string.IsNullOrWhiteSpace(stored)) return stored;
        // Convention: /images/games/{slug}-{type}.webp
        return assetType switch
        {
            "icon"   => $"/images/games/{slug}-icon.webp",
            "banner" => $"/images/games/{slug}-banner.webp",
            _        => null
        };
    }

    /// <summary>
    /// Product thumbnail convention: /images/products/{gameSlug}/{sku}.webp
    /// Falls back to category icon if no file exists (frontend handles missing).
    /// </summary>
    private static string ResolveProductThumbnail(string sku, string gameSlug)
        => $"/images/products/{gameSlug}/{sku}.webp";

    /// <summary>
    /// Infer the in-game currency name from game name.
    /// Generic fallback so ANY new game works automatically.
    /// </summary>
    private static string InferCurrencyName(string gameName)
    {
        var n = gameName.ToLowerInvariant();
        if (n.Contains("mobile legends") || n.Contains("mlbb")) return "Diamonds";
        if (n.Contains("pubg"))                                   return "UC";
        if (n.Contains("genshin"))                                return "Primogems";
        if (n.Contains("honkai") || n.Contains("star rail"))      return "Stellar Jade";
        if (n.Contains("free fire") || n.Contains("ff"))          return "Diamonds";
        if (n.Contains("valorant"))                               return "VP";
        if (n.Contains("zenless") || n.Contains("zzz"))           return "Polychrome";
        if (n.Contains("ragnarok"))                               return "Zeny";
        return "Item"; // generic fallback — safe for any unknown game
    }

    /// <summary>
    /// Generic product classification engine.
    /// Uses name keywords to assign a standardized ItemCategory.
    /// Works for MLBB, PUBG, Genshin, HSR, FF, Valorant, ZZZ, etc.
    /// </summary>
    private static (string Slug, string Label, string Icon, int SortOrder) ClassifyProduct(
        string name, string? description)
    {
        var n = name.ToLowerInvariant();

        // ── Weekly / Battle Pass ──────────────────────────────────────────
        if (n.Contains("weekly diamond") || n.Contains("weekly pass"))
            return ("WEEKLY_PASS", "Weekly Diamond Pass", "🎫", 10);

        if (n.Contains("twilight pass"))
            return ("TWILIGHT", "Twilight Pass", "🌙", 20);

        if (n.Contains("battle pass") || n.Contains("royale pass"))
            return ("BATTLE_PASS", "Battle Pass", "🏆", 15);

        // ── Subscriptions / Membership ────────────────────────────────────
        if (n.Contains("starlight") || n.Contains("membership"))
            return ("SUBSCRIPTION", "Starlight Member", "⭐", 25);

        if (n.Contains("express supply pass") || n.Contains("supply pass"))
            return ("SUBSCRIPTION", "Supply Pass", "📦", 26);

        // ── Bundles / Packs ───────────────────────────────────────────────
        if (n.Contains("elite bundle") || n.Contains("elite pass"))
            return ("BUNDLE", "Elite Bundle", "💎", 30);

        if (n.Contains("limited") || n.Contains("value pack") || n.Contains("special"))
            return ("BUNDLE", "Limited Time Value Pack", "🎁", 35);

        if (n.Contains("bundle") || n.Contains("pack"))
            return ("BUNDLE", "Bundle", "📦", 36);

        // ── Skins / Cosmetics ─────────────────────────────────────────────
        if (n.Contains("skin") || n.Contains("costume") || n.Contains("outfit"))
            return ("SKIN", "Skin & Cosmetics", "🎨", 40);

        // ── Patungan / Group ──────────────────────────────────────────────
        if (n.Contains("patungan") || n.Contains("group"))
            return ("GROUP_BUY", "Patungan", "🤝", 50);

        // ── Standard Currency (catch-all for diamond / crystal / gem etc.) ─
        if (n.Contains("diamond") || n.Contains("crystal") || n.Contains("gems") ||
            n.Contains("uc") || n.Contains("primogem") || n.Contains("stellar jade") ||
            n.Contains("polychrome") || n.Contains("oneiric") || n.Contains("vp") ||
            n.Contains("credit") || n.Contains("zeny") || n.Contains("coin"))
            return ("CURRENCY", "Diamonds", "💎", 5);

        // ── Description fallback ──────────────────────────────────────────
        if (!string.IsNullOrWhiteSpace(description) && description != "General")
            return ("OTHER", description, "📌", 90);

        return ("CURRENCY", "Item", "💎", 5); // ultimate fallback
    }

    private static int CategorySortOrder(string slug) => slug switch
    {
        "WEEKLY_PASS"  => 10,
        "BATTLE_PASS"  => 15,
        "TWILIGHT"     => 20,
        "SUBSCRIPTION" => 25,
        "BUNDLE"       => 30,
        "CURRENCY"     => 5,
        "SKIN"         => 40,
        "GROUP_BUY"    => 50,
        _              => 90
    };

    private static int PaymentGroupSortOrder(string key) => key switch
    {
        "QRIS"            => 1,
        "EWALLET"         => 2,
        "VIRTUAL_ACCOUNT" => 3,
        "RETAIL"          => 4,
        _                 => 9
    };

    private static (string Label, string Flag) PaymentGroupMeta(string key) => key switch
    {
        "QRIS"            => ("QRIS",            "🇮🇩"),
        "EWALLET"         => ("E-Wallet",         "💳"),
        "VIRTUAL_ACCOUNT" => ("Virtual Account",  "🏦"),
        "RETAIL"          => ("Minimarket",        "🏪"),
        _                 => (key, "")
    };

    private static decimal GetEffectivePrice(Models.Product product, string role)
    {
        var sell   = product.PriceSell;
        var member = product.PriceMember;

        decimal rolePrice = role.ToUpper() switch
        {
            "RESELLER" => product.PriceReseller,
            "VIP"      => product.PriceVip,
            _          => sell > 0 ? sell : member   // fallback: if priceSell=0 use priceMember
        };

        // Final safety: never return 0 if member price exists
        return rolePrice > 0 ? rolePrice : member;
    }
}

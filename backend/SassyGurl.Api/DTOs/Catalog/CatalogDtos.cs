namespace SassyGurl.Api.DTOs.Catalog;

// ─────────────────────────────────────────────────────────────
// GAME LIST
// ─────────────────────────────────────────────────────────────

public class GameDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Publisher { get; set; }

    // Asset URLs derived from slug in the service layer
    public string? Thumbnail { get; set; }
    public string? Banner { get; set; }
    public string? GuideImage { get; set; }

    public bool HasServerId { get; set; }
    public string? ServerOptions { get; set; }
    public bool IsHot { get; set; }

    // Currency name (e.g. "Diamonds", "UC", "Primogems")
    public string CurrencyName { get; set; } = "Item";
}

// ─────────────────────────────────────────────────────────────
// PRODUCT
// ─────────────────────────────────────────────────────────────

public class ProductDto
{
    public string Id { get; set; } = null!;
    public string Sku { get; set; } = null!;
    public string Name { get; set; } = null!;

    /// <summary>Standardized category slug: CURRENCY | PASS | BUNDLE | SUBSCRIPTION | SKIN | OTHER</summary>
    public string ItemCategory { get; set; } = "CURRENCY";

    /// <summary>Human-readable category name (e.g. "Weekly Diamond Pass")</summary>
    public string ItemCategoryLabel { get; set; } = "Item";

    /// <summary>Category icon emoji or relative path (UI renders this)</summary>
    public string ItemCategoryIcon { get; set; } = "💎";

    public string? Thumbnail { get; set; }   // product-level image if available
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public bool IsFlashSale { get; set; }
    public int Stock { get; set; }
    public int SortOrder { get; set; }

    /// <summary>
    /// Discount % vs originalPrice. 0 if no discount.
    /// Computed server-side so frontend doesn't need to recalculate.
    /// </summary>
    public int DiscountPercent { get; set; }
}

// ─────────────────────────────────────────────────────────────
// CATEGORY SUMMARY (used in grouped response)
// ─────────────────────────────────────────────────────────────

public class ItemCategoryDto
{
    public string Slug { get; set; } = null!;       // e.g. "PASS"
    public string Label { get; set; } = null!;       // e.g. "Weekly Diamond Pass"
    public string Icon { get; set; } = null!;        // emoji
    public int ItemCount { get; set; }
    public int SortOrder { get; set; }
}

// ─────────────────────────────────────────────────────────────
// GROUPED GAME DETAIL (new endpoint)
// ─────────────────────────────────────────────────────────────

public class GroupedProductsDto
{
    public ItemCategoryDto Category { get; set; } = null!;
    public List<ProductDto> Items { get; set; } = new();
}

public class GameDetailDto : GameDto
{
    /// <summary>All distinct item categories detected for this game</summary>
    public List<ItemCategoryDto> ItemCategories { get; set; } = new();

    /// <summary>Products pre-grouped by ItemCategory (for the Ditusi-style category tabs)</summary>
    public List<GroupedProductsDto> GroupedProducts { get; set; } = new();

    /// <summary>Flat list kept for backward compat with existing pages</summary>
    public List<ProductDto> Products { get; set; } = new();
}

// ─────────────────────────────────────────────────────────────
// PAYMENT METHODS — flat + grouped
// ─────────────────────────────────────────────────────────────

public class PaymentMethodDto
{
    public string Id { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;

    /// <summary>QRIS | EWALLET | VIRTUAL_ACCOUNT | RETAIL</summary>
    public string Type { get; set; } = null!;

    /// <summary>Single logo URL (existing field)</summary>
    public string? Logo { get; set; }

    public decimal FeeFlat { get; set; }
    public decimal FeePercent { get; set; }
    public int SortOrder { get; set; }
}

/// <summary>Payment methods grouped by Type for Ditusi-style accordion UI</summary>
public class PaymentGroupDto
{
    /// <summary>QRIS | EWALLET | VIRTUAL_ACCOUNT | RETAIL</summary>
    public string GroupKey { get; set; } = null!;

    /// <summary>Human-readable group label (e.g. "⚡ QRIS")</summary>
    public string GroupLabel { get; set; } = null!;

    /// <summary>Country flag for the group (e.g. "🇮🇩")</summary>
    public string CountryFlag { get; set; } = "🇮🇩";

    /// <summary>Display order (QRIS first, then EWALLET, etc.)</summary>
    public int SortOrder { get; set; }

    public List<PaymentMethodDto> Methods { get; set; } = new();
}

// ─────────────────────────────────────────────────────────────
// PROVIDER STATUS
// ─────────────────────────────────────────────────────────────

public class ProviderStatusDto
{
    public string Name { get; set; } = null!;
    public bool IsActive { get; set; }
    public decimal SuccessRate { get; set; }
    public int AvgLatency { get; set; }
    public DateTime LastChecked { get; set; } = DateTime.UtcNow;
    public decimal Balance { get; set; }
}

// ─────────────────────────────────────────────────────────────
// ADMIN CRUD DTOs
// ─────────────────────────────────────────────────────────────

public class GameCreateDto
{
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Publisher { get; set; }
    public string? CategoryId { get; set; }
    public bool HasServerId { get; set; }
    public string? ServerOptions { get; set; }
    public string CurrencyName { get; set; } = "Item";
    public bool IsActive { get; set; } = true;
    public bool IsHot { get; set; } = false;
}

public class GameUpdateDto
{
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Publisher { get; set; }
    public string? CategoryId { get; set; }
    public bool HasServerId { get; set; }
    public string? ServerOptions { get; set; }
    public string CurrencyName { get; set; } = "Item";
    public bool IsActive { get; set; }
    public bool IsHot { get; set; }
}

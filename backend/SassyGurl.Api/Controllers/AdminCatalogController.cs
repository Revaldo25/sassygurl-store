using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/admin/catalog")]
public class AdminCatalogController : ControllerBase
{
    private readonly SassyGurlDbContext _context;
    private readonly IWebHostEnvironment _env;

    public AdminCatalogController(SassyGurlDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is empty");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExts = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        if (!allowedExts.Contains(ext)) return BadRequest("Invalid file type");

        var uploadDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/{fileName}";
        return Ok(new { success = true, url });
    }

    [HttpPost("clean-garbage")]
    public async Task<IActionResult> CleanGarbageGames()
    {
        var garbageKeywords = new[] { "product", "datatitle", "frequently", "latest-news", "faq", "news" };
        var garbageGames = await _context.Games
            .Where(g => garbageKeywords.Any(k => g.Slug.Contains(k)))
            .ToListAsync();
        
        _context.Games.RemoveRange(garbageGames);
        await _context.SaveChangesAsync();
        
        return Ok(new { success = true, deleted = garbageGames.Count });
    }

    [HttpPost("seed-ditusi")]
    public async Task<IActionResult> SeedDitusiCatalog([FromBody] SeedRequest req)
    {
        var html = req.HtmlContent;
        if (string.IsNullOrEmpty(html)) return BadRequest("HTML Content is empty");

        // Improved Regex: Ditusi game cards usually have a specific structure.
        // We will match text inside <h3 class="... truncate ...">...</h3> 
        // to avoid grabbing unrelated headings.
        var nameRegex = new Regex(@"<h3[^>]*truncate[^>]*>([^<]+)<\/h3>");
        var matches = nameRegex.Matches(html);

        var added = 0;
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Slug == "mobile-games");
        if (category == null)
        {
            category = new Category { Name = "Mobile Games", Slug = "mobile-games", SortOrder = 1 };
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
        }

        foreach (Match match in matches)
        {
            var gameName = match.Groups[1].Value.Trim();
            // Skip vue/react template strings and generic text
            if (gameName.Contains("Joki", StringComparison.OrdinalIgnoreCase) ||
                gameName.Contains("${", StringComparison.OrdinalIgnoreCase) ||
                gameName.Contains("Frequently", StringComparison.OrdinalIgnoreCase) ||
                gameName.Contains("News", StringComparison.OrdinalIgnoreCase)) continue;

            var slug = Regex.Replace(gameName.ToLowerInvariant(), @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-").Trim('-');

            if (string.IsNullOrEmpty(slug)) continue;

            var exists = await _context.Games.AnyAsync(g => g.Slug == slug);
            if (!exists)
            {
                _context.Games.Add(new Game
                {
                    Name = gameName,
                    Slug = slug,
                    CategoryId = category.Id,
                    CurrencyName = "Item",
                    HasServerId = false,
                    IsActive = false, // set inactive until fully configured
                    Thumbnail = "https://via.placeholder.com/200x200?text=" + Uri.EscapeDataString(gameName)
                });
                added++;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, added });
    }

    [HttpPost("recalc-prices")]
    public async Task<IActionResult> RecalcPrices()
    {
        var products = await _context.Products.ToListAsync();
        var updated = 0;
        foreach (var p in products)
        {
            var basePrice = p.PriceModal;
            decimal marginPercent = 0.03m; // Default
            if (basePrice < 50000m) {
                marginPercent = 0.02m;
            } else if (basePrice >= 50000m && basePrice < 200000m) {
                marginPercent = 0.05m;
            } else if (basePrice >= 200000m && basePrice < 500000m) {
                marginPercent = 0.10m;
            } else if (basePrice >= 500000m) {
                marginPercent = 0.15m;
            }

            decimal rawSalePrice = basePrice * (1m + marginPercent);
            decimal salePrice = Math.Ceiling(rawSalePrice / 100m) * 100m;
            
            p.Margin = salePrice - basePrice;
            p.PriceSell = salePrice;
            p.OriginalPrice = salePrice * 1.15m;
            p.PriceMember = salePrice * 0.98m;
            p.PriceReseller = salePrice * 0.95m;
            p.PriceVip = salePrice * 0.90m;
            updated++;
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = $"Recalculated prices for {updated} products" });
    }


    public class SeedRequest
    {
        public string HtmlContent { get; set; } = "";
    }

    // ==========================================
    // PRODUCT CATEGORY MANAGEMENT
    // ==========================================

    [HttpGet("games")]
    public async Task<IActionResult> GetGames()
    {
        var games = await _context.Games
            .Select(g => new
            {
                g.Id,
                g.Name,
                g.Slug,
                g.IsActive,
                g.Thumbnail,
                g.SortOrder,
                CategoryName = g.Category != null ? g.Category.Name : "Uncategorized"
            })
            .OrderBy(g => g.SortOrder)
            .ToListAsync();
        
        return Ok(new { success = true, data = games });
    }

    [HttpPost("games")]
    public async Task<IActionResult> CreateGame([FromBody] GameCreateRequest req)
    {
        var game = new Game
        {
            Name = req.Name,
            Slug = req.Slug ?? req.Name.ToLower().Replace(" ", "-"),
            Thumbnail = req.Thumbnail ?? "",
            SortOrder = req.SortOrder ?? 0,
            IsActive = req.IsActive ?? false,
            CurrencyName = "Item"
        };
        _context.Games.Add(game);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = game });
    }

    [HttpPut("games/{id}")]
    public async Task<IActionResult> UpdateGame(string id, [FromBody] GameCreateRequest req)
    {
        var game = await _context.Games.FindAsync(id);
        if (game == null) return NotFound(new { success = false, message = "Game not found" });

        game.Name = req.Name;
        if (!string.IsNullOrEmpty(req.Slug)) game.Slug = req.Slug;
        if (!string.IsNullOrEmpty(req.Thumbnail)) game.Thumbnail = req.Thumbnail;
        if (req.SortOrder.HasValue) game.SortOrder = req.SortOrder.Value;
        if (req.IsActive.HasValue) game.IsActive = req.IsActive.Value;

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpDelete("games/{id}")]
    public async Task<IActionResult> DeleteGame(string id)
    {
        var game = await _context.Games.FindAsync(id);
        if (game == null) return NotFound(new { success = false, message = "Game not found" });

        _context.Games.Remove(game);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    public class GameCreateRequest
    {
        public string Name { get; set; } = "";
        public string? Slug { get; set; }
        public string? Thumbnail { get; set; }
        public int? SortOrder { get; set; }
        public bool? IsActive { get; set; }
    }

    [HttpGet("games/{gameId}/categories")]
    public async Task<IActionResult> GetProductCategories(string gameId)
    {
        var categories = await _context.ProductCategories
            .Where(c => c.GameId == gameId)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();
        return Ok(new { success = true, data = categories });
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateProductCategory([FromBody] ProductCategoryCreateRequest req)
    {
        if (req.SortOrder == 0)
        {
            var existingPriorities = await _context.ProductCategories
                .Where(c => c.GameId == req.GameId && c.SortOrder == 0)
                .ToListAsync();
            foreach (var ep in existingPriorities)
            {
                ep.SortOrder = 99;
            }
        }

        var category = new ProductCategory
        {
            GameId = req.GameId,
            Name = req.Name,
            Icon = req.Icon ?? "💎",
            SortOrder = req.SortOrder ?? 0
        };
        _context.ProductCategories.Add(category);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = category });
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteProductCategory(string id)
    {
        var category = await _context.ProductCategories.FindAsync(id);
        if (category == null) return NotFound("Category not found");

        // Set products with this category to null
        var products = await _context.Products.Where(p => p.ProductCategoryId == id).ToListAsync();
        foreach (var p in products) p.ProductCategoryId = null;

        _context.ProductCategories.Remove(category);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateProductCategory(string id, [FromBody] ProductCategoryCreateRequest req)
    {
        var category = await _context.ProductCategories.FindAsync(id);
        if (category == null) return NotFound("Category not found");

        if (req.SortOrder == 0 && category.SortOrder != 0)
        {
            var existingPriorities = await _context.ProductCategories
                .Where(c => c.GameId == category.GameId && c.SortOrder == 0 && c.Id != id)
                .ToListAsync();
            foreach (var ep in existingPriorities)
            {
                ep.SortOrder = 99;
            }
        }

        category.Name = req.Name;
        if (req.Icon != null) category.Icon = req.Icon;
        if (req.SortOrder.HasValue) category.SortOrder = req.SortOrder.Value;

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPut("categories/{id}/products")]
    public async Task<IActionResult> AssignProductsToCategory(string id, [FromBody] List<string> productIds)
    {
        var products = await _context.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();
        foreach(var p in products)
        {
            p.ProductCategoryId = id;
        }
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    public class ProductCategoryCreateRequest
    {
        public string GameId { get; set; } = "";
        public string Name { get; set; } = "";
        public string? Icon { get; set; }
        public int? SortOrder { get; set; }
    }

    // ==========================================
    // PRODUCT MANAGEMENT
    // ==========================================

    [HttpGet("games/{gameId}/products")]
    public async Task<IActionResult> GetProducts(string gameId)
    {
        var products = await _context.Products
            .Where(p => p.GameId == gameId)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Sku,
                p.PriceSell,
                p.IsActive,
                p.ImageUrl,
                p.ProductCategoryId,
                CategoryName = p.ProductCategory != null ? p.ProductCategory.Name : "Uncategorized"
            })
            .OrderBy(p => p.Name)
            .ToListAsync();
        
        return Ok(new { success = true, data = products });
    }

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] ProductCreateRequest req)
    {
        // Fallback to first provider if manual provider not defined
        var provider = await _context.Providers.FirstOrDefaultAsync(p => p.Name == (req.IsManualFulfillment ? "MANUAL" : "VVIP")) 
            ?? new Provider { Name = req.IsManualFulfillment ? "MANUAL" : "VVIP" };
        if (provider.Id == null || provider.Id == "") 
        {
            _context.Providers.Add(provider);
            await _context.SaveChangesAsync();
        }

        var product = new Product
        {
            GameId = req.GameId,
            ProviderId = provider.Id ?? Guid.NewGuid().ToString("N"),
            ProductCategoryId = string.IsNullOrWhiteSpace(req.ProductCategoryId) ? null : req.ProductCategoryId,
            Sku = string.IsNullOrWhiteSpace(req.Sku) ? Guid.NewGuid().ToString("N").Substring(0, 8) : req.Sku,
            Name = req.Name,
            PriceSell = req.PriceSell,
            PriceModal = req.PriceSell * 0.8m, // mock modal
            PriceMember = req.PriceSell * 0.95m,
            PriceReseller = req.PriceSell * 0.90m,
            PriceVip = req.PriceSell * 0.85m,
            OriginalPrice = req.PriceSell * 1.1m,
            Margin = req.PriceSell * 0.2m,
            ImageUrl = req.ImageUrl,
            Source = req.IsManualFulfillment ? SassyGurl.Api.Models.Enums.ProviderSource.MANUAL : SassyGurl.Api.Models.Enums.ProviderSource.VIP,
            IsActive = true
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = product });
    }

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { success = false, message = "Product not found" });

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Product deleted" });
    }

    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] ProductCreateRequest req)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { success = false, message = "Product not found" });

        product.Name = req.Name;
        product.Sku = req.Sku ?? product.Sku;
        product.PriceSell = req.PriceSell;
        if (req.ImageUrl != null) product.ImageUrl = req.ImageUrl;
        
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Product updated" });
    }

    [HttpPost("bulk-markup")]
    public async Task<IActionResult> BulkMarkup([FromBody] BulkMarkupRequest req)
    {
        if (string.IsNullOrEmpty(req.MarkupType) || req.MarkupValue < 0)
        {
            return BadRequest("Invalid markup type or value");
        }

        var query = _context.Products.AsQueryable();
        if (!string.IsNullOrEmpty(req.GameId))
        {
            query = query.Where(p => p.GameId == req.GameId);
        }

        var products = await query.ToListAsync();
        if (!products.Any()) return NotFound("No products found for the given criteria.");

        var updatedCount = 0;
        foreach (var p in products)
        {
            if (req.MarkupType.ToUpper() == "PERCENTAGE")
            {
                var rawMargin = p.PriceModal * (req.MarkupValue / 100m);
                p.Margin = Math.Ceiling(rawMargin / 100m) * 100m; // Bulatkan ke atas ke ratusan terdekat
            }
            else if (req.MarkupType.ToUpper() == "FIXED")
            {
                p.Margin = req.MarkupValue;
            }

            p.PriceSell = p.PriceModal + p.Margin;
            p.OriginalPrice = p.PriceSell * 1.15m;
            p.PriceMember = p.PriceSell * 0.98m;
            p.PriceReseller = p.PriceSell * 0.95m;
            p.PriceVip = p.PriceSell * 0.90m;
            
            updatedCount++;
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, updated = updatedCount, message = $"Berhasil memperbarui harga {updatedCount} item." });
    }

    public class BulkMarkupRequest
    {
        public string? GameId { get; set; }
        public string MarkupType { get; set; } = "PERCENTAGE"; // PERCENTAGE or FIXED
        public decimal MarkupValue { get; set; }
    }

    public class ProductCreateRequest
    {
        public string GameId { get; set; } = "";
        public string Name { get; set; } = "";
        public string? Sku { get; set; }
        public decimal PriceSell { get; set; }
        public string? ImageUrl { get; set; }
        public string? ProductCategoryId { get; set; }
        public bool IsManualFulfillment { get; set; } = false;
    }
}

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
        var provider = await _context.Providers.FirstOrDefaultAsync() 
            ?? new Provider { Name = "Manual Provider" };
        if (provider.Id == null || provider.Id == "") 
        {
            _context.Providers.Add(provider);
            await _context.SaveChangesAsync();
        }

        var product = new Product
        {
            GameId = req.GameId,
            ProviderId = provider.Id,
            Sku = req.Sku ?? Guid.NewGuid().ToString("N").Substring(0, 8),
            Name = req.Name,
            PriceSell = req.PriceSell,
            ImageUrl = req.ImageUrl,
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
        if (product == null) return NotFound("Product not found");

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    public class ProductCreateRequest
    {
        public string GameId { get; set; } = "";
        public string Name { get; set; } = "";
        public string? Sku { get; set; }
        public decimal PriceSell { get; set; }
        public string? ImageUrl { get; set; }
    }
}

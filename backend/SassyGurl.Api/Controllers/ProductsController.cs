using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Services;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly SassyGurl.Api.Data.SassyGurlDbContext _context;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, SassyGurl.Api.Data.SassyGurlDbContext context, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/products/sync
    /// Triggers the background synchronization of all products from VIP Reseller and Digiflazz.
    /// </summary>
    [Authorize(Roles = "SUPERADMIN,OWNER")]
    [HttpPost("sync")]
    public async Task<IActionResult> Sync()
    {
        _logger.LogInformation("Received request to sync all products.");
        try
        {
            var success = await _productService.SyncAllProvidersAsync();
            if (success)
            {
                return Ok(new { success = true, message = "Product synchronization completed successfully." });
            }
            return StatusCode(500, new { success = false, message = "Product synchronization completed with some errors. Check Serilog logs." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception during product synchronization.");
            return StatusCode(500, new { success = false, message = "Internal server error during sync." });
        }
    }

    /// <summary>
    /// GET /api/products
    /// Lists all products from the database.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        _logger.LogInformation("Received request to get all products.");
        var products = await _productService.GetAllProductsAsync();
        return Ok(products);
    }

    /// <summary>
    /// GET /api/products/game/{gameId}
    /// Lists all products for a specific game (Active and Inactive)
    /// </summary>
    [Authorize(Roles = "SUPERADMIN,OWNER")]
    [HttpGet("game/{gameId}")]
    public async Task<IActionResult> GetByGame(string gameId)
    {
        var products = await _context.Products
            .Where(p => p.GameId == gameId)
            .Select(p => new {
                p.Id,
                p.Name,
                p.Sku,
                p.PriceSell,
                p.IsActive,
                p.ProductCategoryId,
                OriginalPrice = p.OriginalPrice ?? p.PriceSell,
                CategoryName = p.ProductCategory != null ? p.ProductCategory.Name : "Uncategorized"
            })
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(new { success = true, data = products });
    }

    /// <summary>
    /// GET /api/products/review-queue
    /// Fetch all products that need admin review.
    /// </summary>
    [Authorize(Roles = "SUPERADMIN,OWNER")]
    [HttpGet("review-queue")]
    public async Task<IActionResult> GetReviewQueue()
    {
        var products = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
            System.Linq.Queryable.OrderBy(
                System.Linq.Queryable.Where(
                    _context.Products.Include(p => p.Game), 
                    p => p.Metadata != null && p.Metadata.Contains("\"needsReview\":true")
                ),
                p => p.Game.Name
            )
        );

        return Ok(new { success = true, data = products });
    }

    /// <summary>
    /// POST /api/products/{id}/resolve
    /// Resolves an ambiguous product (Approve, Reject, or Remap).
    /// </summary>
    [Authorize(Roles = "SUPERADMIN,OWNER")]
    [HttpPost("{id}/resolve")]
    public async Task<IActionResult> ResolveReview(string id, [FromBody] SassyGurl.Api.DTOs.Catalog.ReviewResolveDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound(new { success = false, message = "Product not found." });

        string action = dto.Action.ToUpper();
        if (action != "APPROVE" && action != "REJECT" && action != "REMAP")
        {
            return BadRequest(new { success = false, message = "Invalid action. Use APPROVE, REJECT, or REMAP." });
        }

        if (action == "REMAP" && string.IsNullOrWhiteSpace(dto.TargetCategory))
        {
            return BadRequest(new { success = false, message = "TargetCategory is required for REMAP action." });
        }

        // Parse existing metadata
        var metaDict = new System.Collections.Generic.Dictionary<string, object>();
        if (!string.IsNullOrWhiteSpace(product.Metadata))
        {
            try
            {
                var doc = System.Text.Json.JsonDocument.Parse(product.Metadata);
                foreach (var prop in doc.RootElement.EnumerateObject())
                {
                    if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.True || prop.Value.ValueKind == System.Text.Json.JsonValueKind.False)
                        metaDict[prop.Name] = prop.Value.GetBoolean();
                    else if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.String)
                        metaDict[prop.Name] = prop.Value.GetString()!;
                    else if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Number)
                        metaDict[prop.Name] = prop.Value.GetDouble();
                }
            }
            catch { }
        }

        // Remove needsReview flag
        metaDict.Remove("needsReview");

        // Apply action
        if (action == "APPROVE")
        {
            product.IsActive = true;
        }
        else if (action == "REJECT")
        {
            product.IsActive = false;
        }
        else if (action == "REMAP")
        {
            product.IsActive = true;
            metaDict["itemCategory"] = dto.TargetCategory!;
            metaDict["isManuallyMapped"] = true;
            metaDict["mappedBy"] = User.Identity?.Name ?? "Admin";
            metaDict["mappedAt"] = DateTime.UtcNow.ToString("O");
        }

        product.Metadata = System.Text.Json.JsonSerializer.Serialize(metaDict);

        _context.Update(product);
        await _context.SaveChangesAsync();

        // Let caller invalidate cache, or invalidate here directly if IMemoryCache injected (omitted for brevity)
        return Ok(new { success = true, message = $"Product successfully resolved with action: {action}", product });
    }

    /// <summary>
    /// GET /api/catalog/health
    /// Returns catalog health metrics for the admin dashboard.
    /// </summary>
    [Authorize(Roles = "SUPERADMIN,OWNER")]
    [HttpGet("/api/catalog/health")]
    public async Task<IActionResult> GetCatalogHealth()
    {
        var totalProducts = await _context.Products.CountAsync();
        var activeProducts = await _context.Products.CountAsync(p => p.IsActive);
        var inactiveProducts = totalProducts - activeProducts;

        var needsReviewProducts = await _context.Products.CountAsync(p => p.Metadata != null && p.Metadata.Contains("\"needsReview\":true"));
        
        // Products without category/grouping
        var noGroupProducts = await _context.Products.CountAsync(p => p.Metadata == null || !p.Metadata.Contains("\"itemCategory\""));

        var lastSyncLog = await _context.ProviderSyncLogs
            .OrderByDescending(l => l.CreatedAt)
            .FirstOrDefaultAsync();

        var recentLogs = await _context.ProviderSyncLogs
            .OrderByDescending(l => l.CreatedAt)
            .Take(10)
            .ToListAsync();
        
        var avgLatency = recentLogs.Any() ? Math.Round(recentLogs.Average(l => l.DurationMs), 0) + "ms" : "N/A";
        var syncFailures = recentLogs.Count(l => l.HttpStatus != 200 || l.ErrorCount > 0);
        var syncStatus = syncFailures == 0 ? "OK" : "WARNING";
        
        var health = new {
            success = true,
            data = new {
                totalProducts,
                activeProducts,
                inactiveProducts,
                needsReviewProducts,
                productsWithoutGrouping = noGroupProducts,
                productsWithoutAssets = 0, // TBD: needs asset checking logic
                syncStatus = syncStatus,
                syncFailures = syncFailures,
                providerLatency = avgLatency,
                lastSyncTime = lastSyncLog?.CreatedAt.ToString("O") ?? DateTime.UtcNow.ToString("O")
            }
        };

        return Ok(health);
    }
}

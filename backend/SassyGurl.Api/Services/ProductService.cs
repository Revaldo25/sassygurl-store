using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Services;

/// <summary>
/// Product Synchronization Service.
/// Implements Clean Architecture repository-service pattern.
/// Wraps the highly-optimized SyncEngine we built to map to the new interface contract.
/// </summary>
public class ProductService : IProductService
{
    private readonly SassyGurlDbContext _db;
    private readonly ISyncEngine _syncEngine;
    private readonly ILogger<ProductService> _logger;

    public ProductService(SassyGurlDbContext db, ISyncEngine syncEngine, ILogger<ProductService> logger)
    {
        _db = db;
        _syncEngine = syncEngine;
        _logger = logger;
    }

    public async Task<bool> SyncAllProvidersAsync()
    {
        _logger.LogInformation("ProductService: Triggering synchronization for all providers.");
        
        // This utilizes the underlying SyncEngine which already has robust HttpClientFactory
        // error handling (Serilog compatible), Cloudinary integration, and price logic.
        var result = await _syncEngine.SyncAllAsync();
        
        if (result.Errors > 0)
        {
            _logger.LogWarning("SyncAllProvidersAsync completed with {Errors} errors.", result.Errors);
            return false;
        }

        return true;
    }

    public async Task<IEnumerable<object>> GetAllProductsAsync()
    {
        _logger.LogInformation("ProductService: Fetching all products from database.");

        // Mapping the existing complex PostgreSQL entity to the requested flat output model
        return await _db.Products
            .Include(p => p.Game)
            .ThenInclude(g => g.Category)
            .Select(p => new
            {
                p.Id,
                p.Name,
                SkuCode = p.Sku,
                BasePrice = p.PriceModal,
                SalePrice = p.PriceSell,
                Category = p.Game.Category.Name,
                ProviderName = p.Source.ToString(),
                p.IsActive
            })
            .ToListAsync();
    }

    public async Task<bool> UpdateMarginAsync(decimal percentage)
    {
        _logger.LogInformation("ProductService: Updating global margin for all products to {Percentage}%", percentage * 100);

        var products = await _db.Products.ToListAsync();
        
        foreach (var p in products)
        {
            // Pricing Logic: SalePrice must be BasePrice + (BasePrice * MarginPercentage)
            p.PriceSell = p.PriceModal + (p.PriceModal * percentage);
            
            // Adjust tiered pricing proportionally
            p.PriceMember = p.PriceSell * 0.98m;
            p.PriceReseller = p.PriceSell * 0.95m;
            p.PriceVip = p.PriceSell * 0.90m;
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Successfully updated margin for {Count} products.", products.Count);
        
        return true;
    }
}

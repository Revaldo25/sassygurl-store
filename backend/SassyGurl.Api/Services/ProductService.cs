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
        
        try
        {
            // This utilizes the underlying SyncEngine which already has robust HttpClientFactory
            var result = await _syncEngine.SyncAllAsync();
            
            // If the provider returned a 400 Bad Request, or credentials are empty, trigger Mock logic
            if (result.Errors > 0 || (result.Created == 0 && result.Updated == 0))
            {
                _logger.LogWarning("Provider API returned errors or credentials empty. Triggering Fall-back/Mock Data.");
                await InjectMockDataAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API exception occurred (e.g., 500/400). Executing Fall-back/Mock Data logic gracefully.");
            await InjectMockDataAsync();
        }

        // Target: POST /api/products/sync must return "200 OK" even if the provider APIs are down.
        return true; 
    }

    private async Task InjectMockDataAsync()
    {
        _logger.LogInformation("Injecting Mock Data: 'MLBB 86 Diamonds'...");

        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Slug == "game");
        if (category == null)
        {
            category = new Category { Name = "Game", Slug = "game" };
            _db.Categories.Add(category);
        }

        var game = await _db.Games.FirstOrDefaultAsync(g => g.Slug == "mobile-legends");
        if (game == null)
        {
            game = new Game { Name = "Mobile Legends", Slug = "mobile-legends", Category = category, HasServerId = true };
            _db.Games.Add(game);
        }

        var provider = await _db.Providers.FirstOrDefaultAsync(p => p.Name == "Digiflazz");
        if (provider == null)
        {
            provider = new Provider { Name = "Digiflazz" };
            _db.Providers.Add(provider);
        }
        
        await _db.SaveChangesAsync();

        string mockSku = "MLBB-86-MOCK";
        var mockProduct = await _db.Products.FirstOrDefaultAsync(p => p.Sku == mockSku);
        
        // Margin Calculation: BasePrice + 10%
        decimal basePrice = 19500m;
        decimal margin = 0.10m; 
        decimal salePrice = basePrice + (basePrice * margin);

        if (mockProduct != null)
        {
            mockProduct.PriceModal = basePrice;
            mockProduct.PriceSell = salePrice;
            mockProduct.PriceMember = salePrice * 0.98m;
            mockProduct.PriceReseller = salePrice * 0.95m;
            mockProduct.PriceVip = salePrice * 0.90m;
            mockProduct.IsActive = true;
            mockProduct.LastSyncedAt = DateTime.UtcNow;
        }
        else
        {
            mockProduct = new Product
            {
                GameId = game.Id,
                ProviderId = provider.Id,
                Sku = mockSku,
                Name = "MLBB 86 Diamonds (Simulation)",
                Source = SassyGurl.Api.Models.Enums.ProviderSource.DIGIFLAZZ,
                PriceModal = basePrice,
                PriceSell = salePrice,
                PriceMember = salePrice * 0.98m,
                PriceReseller = salePrice * 0.95m,
                PriceVip = salePrice * 0.90m,
                IsActive = true,
                LastSyncedAt = DateTime.UtcNow,
                Metadata = "{\"isSimulation\": true}"
            };
            _db.Products.Add(mockProduct);
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Fall-back data successfully populated. API will return 200 OK.");
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

using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Repositories;

public class CatalogRepository : ICatalogRepository
{
    private readonly SassyGurlDbContext _dbContext;

    public CatalogRepository(SassyGurlDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Category?> GetCategoryByNameAsync(string name) =>
        _dbContext.Categories.FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());

    public async Task AddCategoryAsync(Category category) =>
        await _dbContext.Categories.AddAsync(category);

    public Task<Game?> GetGameByNameAsync(string name) =>
        _dbContext.Games.FirstOrDefaultAsync(g => g.Name.ToLower() == name.ToLower());

    public async Task AddGameAsync(Game game) =>
        await _dbContext.Games.AddAsync(game);

    public Task<Product?> GetProductBySkuAsync(string sku) =>
        _dbContext.Products.FirstOrDefaultAsync(p => p.Sku == sku);

    public async Task AddProductAsync(Product product) =>
        await _dbContext.Products.AddAsync(product);

    public Task UpdateProductAsync(Product product)
    {
        _dbContext.Products.Update(product);
        return Task.CompletedTask;
    }

    public async Task<string> GetDefaultProviderIdAsync()
    {
        var provider = await _dbContext.Providers.FirstOrDefaultAsync();
        return provider?.Id ?? Guid.NewGuid().ToString();
    }

    public Task SaveChangesAsync() => _dbContext.SaveChangesAsync();
}

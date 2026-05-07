using SassyGurl.Api.Models;

namespace SassyGurl.Api.Repositories;

public interface ICatalogRepository
{
    Task<Category?> GetCategoryByNameAsync(string name);
    Task AddCategoryAsync(Category category);
    
    Task<Game?> GetGameByNameAsync(string name);
    Task AddGameAsync(Game game);

    Task<Product?> GetProductBySkuAsync(string sku);
    Task AddProductAsync(Product product);
    Task UpdateProductAsync(Product product);
    
    Task<string> GetDefaultProviderIdAsync();
    
    Task SaveChangesAsync();
}

namespace SassyGurl.Api.Services;

public interface IProductService
{
    Task<bool> SyncAllProvidersAsync();
    Task<IEnumerable<object>> GetAllProductsAsync();
    Task<bool> UpdateMarginAsync(decimal percentage);
}

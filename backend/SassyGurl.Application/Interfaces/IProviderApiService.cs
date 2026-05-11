using SassyGurl.Application.DTOs;

namespace SassyGurl.Application.Interfaces;

/// <summary>
/// Generic interface for interacting with different top-up providers 
/// (e.g., Digiflazz, VIP Reseller).
/// </summary>
public interface IProviderApiService
{
    /// <summary>
    /// Gets the unique identifier/name of the provider (e.g., "Digiflazz", "VipReseller").
    /// </summary>
    string ProviderName { get; }

    /// <summary>
    /// Retrieves the current account balance from the provider.
    /// </summary>
    Task<decimal> GetBalanceAsync();

    /// <summary>
    /// Fetches the complete catalog of products from the provider.
    /// </summary>
    Task<List<ProviderProductDto>> GetProductsAsync();

    /// <summary>
    /// Creates a top-up order via the provider's API.
    /// </summary>
    Task<ProviderOrderResponseDto> CreateOrderAsync(string sku, string customerTarget, string internalOrderId);
}

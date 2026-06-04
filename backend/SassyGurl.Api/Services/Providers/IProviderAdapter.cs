namespace SassyGurl.Api.Services.Providers;

public class ProviderOrderResult
{
    public bool IsSuccess { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string? ProviderRef { get; set; }
    public string? Sn { get; set; }
    public string? Message { get; set; }
}

public interface IProviderAdapter
{
    string ProviderName { get; }
    Task<ProviderOrderResult> PlaceOrderAsync(string sku, string targetId, string zoneId, string refId);
}

using System.Text.Json.Serialization;

namespace SassyGurl.Api.Models;

public class ProductMetadata
{
    [JsonPropertyName("needsZoneId")] 
    public bool NeedsZoneId { get; set; }
    
    [JsonPropertyName("syncType")] 
    public string? SyncType { get; set; }
    
    [JsonPropertyName("providerType")] 
    public string? ProviderType { get; set; }
    
    [JsonPropertyName("categoryGroup")] 
    public string? CategoryGroup { get; set; }
    
    [JsonPropertyName("needsReview")] 
    public bool NeedsReview { get; set; }
    
    [JsonPropertyName("isManuallyMapped")] 
    public bool IsManuallyMapped { get; set; }
    
    [JsonPropertyName("itemCategory")] 
    public string? ItemCategory { get; set; }
    
    [JsonPropertyName("mappedBy")] 
    public string? MappedBy { get; set; }
    
    [JsonPropertyName("mappedAt")] 
    public string? MappedAt { get; set; }

    [JsonPropertyName("providerMappings")]
    public Dictionary<string, ProviderMappingInfo> ProviderMappings { get; set; } = new();
}

public class ProviderMappingInfo
{
    [JsonPropertyName("sku")] 
    public string Sku { get; set; } = string.Empty;
    
    [JsonPropertyName("price")] 
    public decimal Price { get; set; }
    
    [JsonPropertyName("updatedAt")] 
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

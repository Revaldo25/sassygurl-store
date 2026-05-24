using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SassyGurl.Api.Services;

public class RegistryGameEntry
{
    [JsonPropertyName("canonical_name")]
    public string CanonicalName { get; set; } = null!;

    [JsonPropertyName("display_title")]
    public string DisplayTitle { get; set; } = null!;

    [JsonPropertyName("slug")]
    public string Slug { get; set; } = null!;

    [JsonPropertyName("aliases")]
    public List<string> Aliases { get; set; } = [];

    [JsonPropertyName("short_names")]
    public List<string> ShortNames { get; set; } = [];

    [JsonPropertyName("search_keywords")]
    public List<string> SearchKeywords { get; set; } = [];

    [JsonPropertyName("category")]
    public string Category { get; set; } = null!;

    [JsonPropertyName("provider_keywords")]
    public List<string> ProviderKeywords { get; set; } = [];

    [JsonPropertyName("asset_keywords")]
    public List<string> AssetKeywords { get; set; } = [];

    [JsonPropertyName("confidence_level")]
    public string ConfidenceLevel { get; set; } = null!;

    [JsonPropertyName("needs_review")]
    public bool NeedsReview { get; set; }
}

public class ManifestAssetEntry
{
    [JsonPropertyName("hero")]
    public string Hero { get; set; } = null!;

    [JsonPropertyName("thumbnail")]
    public string Thumbnail { get; set; } = null!;

    [JsonPropertyName("logo")]
    public string Logo { get; set; } = null!;

    [JsonPropertyName("accent")]
    public string Accent { get; set; } = null!;
}

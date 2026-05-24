using System.Collections.Generic;

namespace SassyGurl.Api.Services;

public interface IGameRegistryService
{
    RegistryGameEntry? GetGameBySlug(string slug);
    ManifestAssetEntry? GetGameAssets(string slug);
    string? NormalizeBrandToSlug(string brand);
    bool IsAmbiguousAlias(string alias);
    IEnumerable<RegistryGameEntry> GetAllRegistryEntries();
}

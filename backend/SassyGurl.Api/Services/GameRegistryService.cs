using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace SassyGurl.Api.Services;

public class GameRegistryService : IGameRegistryService
{
    private readonly ILogger<GameRegistryService> _logger;
    private readonly Dictionary<string, RegistryGameEntry> _registryBySlug = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, string> _aliases = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, ManifestAssetEntry> _manifest = new(StringComparer.OrdinalIgnoreCase);

    public GameRegistryService(ILogger<GameRegistryService> logger)
    {
        _logger = logger;
        LoadRegistryData();
    }

    private void LoadRegistryData()
    {
        try
        {
            var registryDir = FindRegistryDirectory();
            if (registryDir == null)
            {
                _logger.LogError("Could not locate shared/registry directory starting from {BaseDir}", AppContext.BaseDirectory);
                return;
            }

            _logger.LogInformation("Loading game registry from: {Path}", registryDir);

            // 1. Load Registry
            var registryPath = Path.Combine(registryDir, "games_registry.json");
            if (File.Exists(registryPath))
            {
                var content = File.ReadAllText(registryPath);
                var games = JsonSerializer.Deserialize<List<RegistryGameEntry>>(content);
                if (games != null)
                {
                    foreach (var game in games)
                    {
                        _registryBySlug[game.Slug] = game;
                    }
                }
            }
            else
            {
                _logger.LogError("Registry file not found at: {Path}", registryPath);
            }

            // 2. Load Aliases
            var aliasesPath = Path.Combine(registryDir, "games_aliases.json");
            if (File.Exists(aliasesPath))
            {
                var content = File.ReadAllText(aliasesPath);
                var aliases = JsonSerializer.Deserialize<Dictionary<string, string>>(content);
                if (aliases != null)
                {
                    foreach (var kvp in aliases)
                    {
                        _aliases[kvp.Key] = kvp.Value;
                    }
                }
            }
            else
            {
                _logger.LogError("Aliases file not found at: {Path}", aliasesPath);
            }

            // 3. Load Manifest
            var manifestPath = Path.Combine(registryDir, "games_manifest.json");
            if (File.Exists(manifestPath))
            {
                var content = File.ReadAllText(manifestPath);
                var assets = JsonSerializer.Deserialize<Dictionary<string, ManifestAssetEntry>>(content);
                if (assets != null)
                {
                    foreach (var kvp in assets)
                    {
                        _manifest[kvp.Key] = kvp.Value;
                    }
                }
            }
            else
            {
                _logger.LogError("Manifest file not found at: {Path}", manifestPath);
            }

            _logger.LogInformation("Successfully loaded {GameCount} games, {AliasCount} aliases, and {AssetCount} asset manifests.",
                _registryBySlug.Count, _aliases.Count, _manifest.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading game registry JSON files");
        }
    }

    private string? FindRegistryDirectory()
    {
        // Try paths starting from Current Directory
        var pathsToTry = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "../../shared/registry"),
            Path.Combine(Directory.GetCurrentDirectory(), "../shared/registry"),
            Path.Combine(Directory.GetCurrentDirectory(), "shared/registry"),
            Path.Combine(AppContext.BaseDirectory, "../../../shared/registry"),
            Path.Combine(AppContext.BaseDirectory, "../../shared/registry"),
            Path.Combine(AppContext.BaseDirectory, "../shared/registry"),
            Path.Combine(AppContext.BaseDirectory, "shared/registry")
        };

        foreach (var path in pathsToTry)
        {
            if (Directory.Exists(path))
            {
                return Path.GetFullPath(path);
            }
        }

        // Walk upwards from Base Directory as fallback
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            var testPath = Path.Combine(dir.FullName, "shared", "registry");
            if (Directory.Exists(testPath))
            {
                return testPath;
            }
            dir = dir.Parent;
        }

        return null;
    }

    public RegistryGameEntry? GetGameBySlug(string slug)
    {
        return _registryBySlug.TryGetValue(slug, out var entry) ? entry : null;
    }

    public ManifestAssetEntry? GetGameAssets(string slug)
    {
        return _manifest.TryGetValue(slug, out var entry) ? entry : null;
    }

    public string? NormalizeBrandToSlug(string brand)
    {
        if (string.IsNullOrWhiteSpace(brand)) return null;

        // Clean input brand: lowercase, remove spaces and non-alphanumeric chars
        var cleaned = new string(brand.ToLowerInvariant()
            .Where(c => char.IsLetterOrDigit(c))
            .ToArray());

        if (_aliases.TryGetValue(cleaned, out var slug))
        {
            // Verify confidence level of resolved game
            var game = GetGameBySlug(slug);
            if (game != null)
            {
                if (game.NeedsReview || string.Equals(game.ConfidenceLevel, "low", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Resolved brand '{Brand}' to slug '{Slug}' but marked as needs_review=true or low confidence. Skipping auto-map.", brand, slug);
                    return null;
                }
                return slug;
            }
        }

        return null;
    }

    public bool IsAmbiguousAlias(string alias)
    {
        if (string.IsNullOrWhiteSpace(alias)) return false;

        var cleaned = new string(alias.ToLowerInvariant()
            .Where(c => char.IsLetterOrDigit(c))
            .ToArray());

        if (_aliases.TryGetValue(cleaned, out var slug))
        {
            var game = GetGameBySlug(slug);
            return game != null && (game.NeedsReview || string.Equals(game.ConfidenceLevel, "low", StringComparison.OrdinalIgnoreCase));
        }

        return false;
    }

    public IEnumerable<RegistryGameEntry> GetAllRegistryEntries()
    {
        return _registryBySlug.Values;
    }
}

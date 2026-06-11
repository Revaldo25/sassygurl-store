using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;
using System.Text.Json;

namespace SassyGurl.Api.Services;

public interface IGameSeeder
{
    Task<bool> SeedFromRegistryAsync();
}

public class GameSeeder : IGameSeeder
{
    private readonly SassyGurlDbContext _context;
    private readonly ILogger<GameSeeder> _logger;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _env;

    public GameSeeder(
        SassyGurlDbContext context,
        ILogger<GameSeeder> logger,
        IConfiguration configuration,
        IWebHostEnvironment env)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
        _env = env;
    }

    private string GetRegistryPath()
    {
        // Priority 1: explicit env var (untuk production/Docker)
        var envPath = _configuration["GameRegistry:Path"];
        if (!string.IsNullOrWhiteSpace(envPath) && File.Exists(envPath))
            return envPath;

        // Priority 2: relative ke root aplikasi (untuk development & Linux VPS)
        var candidates = new[]
        {
            Path.Combine(_env.ContentRootPath, "..", "..", "shared", "registry", "games_registry.json"),
            Path.Combine(_env.ContentRootPath, "shared", "registry", "games_registry.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "shared", "registry", "games_registry.json"),
            // Legacy Windows path — fallback terakhir
            @"d:\sassygurlstore\shared\registry\games_registry.json",
        };

        foreach (var path in candidates)
        {
            var normalized = Path.GetFullPath(path);
            if (File.Exists(normalized))
                return normalized;
        }

        return candidates[0]; // Kembalikan path default agar error message jelas
    }

    public async Task<bool> SeedFromRegistryAsync()
    {
        try
        {
            var registryPath = GetRegistryPath();
            if (!File.Exists(registryPath))
            {
                _logger.LogError("Registry file tidak ditemukan di: {Path}. Set env var GameRegistry:Path atau pastikan file ada di shared/registry/games_registry.json", registryPath);
                return false;
            }

            var json = await File.ReadAllTextAsync(registryPath);
            using var doc = JsonDocument.Parse(json);
            
            var games = doc.RootElement.EnumerateArray();
            int added = 0;
            int updated = 0;

            // Define which Tier 1 games are active
            var activeSlugs = new HashSet<string> { "mlbb", "ff" }; // PUBG and HOK remain inactive for now

            foreach (var game in games)
            {
                var slug = game.GetProperty("slug").GetString()!;
                var name = game.GetProperty("canonical_name").GetString()!;
                var title = game.GetProperty("display_title").GetString()!;
                
                var isActive = activeSlugs.Contains(slug);

                var existing = await _context.Games.FirstOrDefaultAsync(g => g.Slug == slug);
                if (existing == null)
                {
                    _context.Games.Add(new Game
                    {
                        Id = Guid.NewGuid().ToString(),
                        Slug = slug,
                        Name = title, // Use display_title for storefront
                        IsActive = isActive
                    });
                    added++;
                }
                else
                {
                    existing.Name = title;
                    existing.IsActive = isActive;
                    _context.Update(existing);
                    updated++;
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"Game seeding completed. Added: {added}, Updated: {updated}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to seed games from registry");
            return false;
        }
    }
}

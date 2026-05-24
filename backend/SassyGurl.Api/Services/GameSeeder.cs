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
    private readonly string _registryPath = @"d:\sassygurlstore\shared\registry\games_registry.json";

    public GameSeeder(SassyGurlDbContext context, ILogger<GameSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> SeedFromRegistryAsync()
    {
        try
        {
            if (!File.Exists(_registryPath))
            {
                _logger.LogError($"Registry file not found at {_registryPath}");
                return false;
            }

            var json = await File.ReadAllTextAsync(_registryPath);
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

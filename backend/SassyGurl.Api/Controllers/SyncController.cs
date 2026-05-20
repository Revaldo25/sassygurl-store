using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SassyGurl.Api.Services;
using System.ComponentModel.DataAnnotations;

namespace SassyGurl.Api.Controllers;

/// <summary>
/// Phase 2: Dedicated Sync Controller with webhook-style secret protection and Swagger support.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SyncController : ControllerBase
{
    private readonly ISyncEngine _syncEngine;
    private readonly IProductService _productService;
    private readonly IProviderService _providerService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SyncController> _logger;

    public SyncController(
        ISyncEngine syncEngine,
        IProductService productService,
        IProviderService providerService,
        IConfiguration configuration,
        ILogger<SyncController> logger)
    {
        _syncEngine = syncEngine;
        _productService = productService;
        _providerService = providerService;
        _configuration = configuration;
        _logger = logger;
    }

    private bool IsWebhookSecretValid(string providedSecret)
    {
        var expectedSecret = _configuration["Sync:WebhookSecret"];
        if (string.IsNullOrWhiteSpace(expectedSecret))
        {
            _logger.LogError("Sync:WebhookSecret is not configured. Rejecting all sync requests.");
            return false;
        }
        return string.Equals(providedSecret, expectedSecret, StringComparison.Ordinal);
    }

    /// <summary>
    /// POST /api/sync/digiflazz
    /// Triggers Digiflazz-only product synchronization.
    /// Protected by X-Webhook-Secret header.
    /// </summary>
    /// <param name="webhookSecret">The secret key for authorization.</param>
    /// <param name="idempotencyKey">Optional idempotency key for safe retries.</param>
    [HttpPost("digiflazz")]
    public async Task<IActionResult> SyncDigiflazz(
        [FromHeader(Name = "X-Webhook-Secret")][Required] string webhookSecret,
        [FromHeader(Name = "X-Idempotency-Key")] string? idempotencyKey = null)
    {
        if (!IsWebhookSecretValid(webhookSecret))
        {
            _logger.LogWarning("Unauthorized sync attempt with invalid secret from {IP}", HttpContext.Connection.RemoteIpAddress);
            return Unauthorized(new { success = false, message = "Invalid X-Webhook-Secret header." });
        }

        _logger.LogInformation("Authorized Digiflazz sync triggered. IdempotencyKey: {Key}", idempotencyKey ?? "N/A");
        var result = await _syncEngine.SyncFromDigiflazzAsync();

        return Ok(new
        {
            success = result.Errors == 0,
            provider = result.Provider,
            created = result.Created,
            updated = result.Updated,
            errors = result.Errors,
            durationMs = result.Duration.TotalMilliseconds
        });
    }

    /// <summary>
    /// POST /api/sync/vip
    /// Triggers VIP Reseller-only product synchronization.
    /// </summary>
    [HttpPost("vip")]
    public async Task<IActionResult> SyncVip(
        [FromHeader(Name = "X-Webhook-Secret")][Required] string webhookSecret)
    {
        if (!IsWebhookSecretValid(webhookSecret))
        {
            return Unauthorized(new { success = false, message = "Invalid X-Webhook-Secret header." });
        }

        _logger.LogInformation("Authorized VIP Reseller sync triggered.");
        var result = await _syncEngine.SyncFromVipResellerAsync();

        return Ok(new
        {
            success = result.Errors == 0,
            provider = result.Provider,
            created = result.Created,
            updated = result.Updated,
            errors = result.Errors,
            durationMs = result.Duration.TotalMilliseconds
        });
    }

    /// <summary>
    /// POST /api/sync/all
    /// Triggers full sync (both Digiflazz + VIP Reseller).
    /// </summary>
    [HttpPost("all")]
    public async Task<IActionResult> SyncAll(
        [FromHeader(Name = "X-Webhook-Secret")][Required] string webhookSecret)
    {
        if (!IsWebhookSecretValid(webhookSecret))
        {
            return Unauthorized(new { success = false, message = "Invalid X-Webhook-Secret header." });
        }

        _logger.LogInformation("Authorized FULL sync triggered (Digiflazz + VIP).");
        var result = await _syncEngine.SyncAllAsync();

        return Ok(new
        {
            success = result.Errors == 0,
            provider = result.Provider,
            created = result.Created,
            updated = result.Updated,
            errors = result.Errors,
            durationMs = result.Duration.TotalMilliseconds
        });
    }

    /// <summary>
    /// GET /api/sync/balance
    /// Check Digiflazz deposit balance.
    /// </summary>
    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance(
        [FromHeader(Name = "X-Webhook-Secret")][Required] string webhookSecret)
    {
        if (!IsWebhookSecretValid(webhookSecret))
        {
            return Unauthorized(new { success = false, message = "Invalid X-Webhook-Secret header." });
        }

        var balance = await _providerService.GetDigiflazzBalanceAsync();
        return Ok(new
        {
            success = balance.IsSuccess,
            balance = balance.Balance,
            message = balance.Message
        });
    }

    [HttpPost("seed-mock")]
    public async Task<IActionResult> SeedMock([FromServices] SassyGurl.Api.Data.SassyGurlDbContext db)
    {
        var mlbb = db.Games.FirstOrDefault(g => g.Slug == "mlbb");
        var genshin = db.Games.FirstOrDefault(g => g.Slug == "genshin");
        var pubg = db.Games.FirstOrDefault(g => g.Slug == "pubg");
        
        var provider = db.Providers.FirstOrDefault();
        if (provider == null) return BadRequest("No provider found");

        var products = new List<SassyGurl.Api.Models.Product>();

        if (mlbb != null && !db.Products.Any(p => p.GameId == mlbb.Id))
        {
            products.AddRange(new[] {
                new SassyGurl.Api.Models.Product { GameId = mlbb.Id, ProviderId = provider.Id, Sku = "MLBB11", Name = "11 Diamonds", OriginalName = "Mobile Legends - 11 Diamond", CleanName = "11 Diamonds", PriceModal = 2000, Margin = 1500, PriceSell = 3500, OriginalPrice = 4500, IsActive = true, Source = SassyGurl.Api.Models.Enums.ProviderSource.VIP },
                new SassyGurl.Api.Models.Product { GameId = mlbb.Id, ProviderId = provider.Id, Sku = "MLBB36", Name = "36 Diamonds", OriginalName = "Mobile Legends - 36 Diamond", CleanName = "36 Diamonds", PriceModal = 6000, Margin = 1500, PriceSell = 7500, OriginalPrice = 8500, IsActive = true, Source = SassyGurl.Api.Models.Enums.ProviderSource.VIP },
                new SassyGurl.Api.Models.Product { GameId = mlbb.Id, ProviderId = provider.Id, Sku = "MLBB72", Name = "72 Diamonds", OriginalName = "Mobile Legends - 72 Diamond", CleanName = "72 Diamonds", PriceModal = 10500, Margin = 1500, PriceSell = 12000, OriginalPrice = 13500, IsActive = true, Source = SassyGurl.Api.Models.Enums.ProviderSource.VIP }
            });
        }

        if (genshin != null && !db.Products.Any(p => p.GameId == genshin.Id))
        {
            products.AddRange(new[] {
                new SassyGurl.Api.Models.Product { GameId = genshin.Id, ProviderId = provider.Id, Sku = "GI60", Name = "60 Genesis Crystals", OriginalName = "Genshin - 60 Genesis Crystal", CleanName = "60 Genesis Crystals", PriceModal = 1800, Margin = 2000, PriceSell = 3800, OriginalPrice = 4800, IsActive = true, Source = SassyGurl.Api.Models.Enums.ProviderSource.VIP },
                new SassyGurl.Api.Models.Product { GameId = genshin.Id, ProviderId = provider.Id, Sku = "GI300", Name = "300 Genesis Crystals", OriginalName = "Genshin - 300 Genesis Crystal", CleanName = "300 Genesis Crystals", PriceModal = 8000, Margin = 2000, PriceSell = 10000, OriginalPrice = 12000, IsActive = true, Source = SassyGurl.Api.Models.Enums.ProviderSource.VIP }
            });
        }

        if (pubg != null && !db.Products.Any(p => p.GameId == pubg.Id))
        {
            products.AddRange(new[] {
                new SassyGurl.Api.Models.Product { GameId = pubg.Id, ProviderId = provider.Id, Sku = "PUBG60", Name = "60 UC", OriginalName = "PUBG UC - 60 UC", CleanName = "60 UC", PriceModal = 2000, Margin = 1000, PriceSell = 3000, OriginalPrice = 4000, IsActive = true, Source = SassyGurl.Api.Models.Enums.ProviderSource.VIP }
            });
        }

        if (products.Any())
        {
            db.Products.AddRange(products);
            await db.SaveChangesAsync();
        }

        return Ok(new { success = true, count = products.Count });
    }
}

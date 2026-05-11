using Microsoft.AspNetCore.Mvc;
using SassyGurl.Api.Services;

namespace SassyGurl.Api.Controllers;

/// <summary>
/// Phase 2: Dedicated Sync Controller with webhook-style secret protection.
/// Endpoint: POST /api/sync/digiflazz — Protected by X-Webhook-Secret header.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SyncController : ControllerBase
{
    private readonly ISyncEngine _syncEngine;
    private readonly IProductService _productService;
    private readonly IProviderService _providerService;
    private readonly ILogger<SyncController> _logger;

    private const string WEBHOOK_SECRET = "SASSY_ELITE_SECURE_2026";

    public SyncController(
        ISyncEngine syncEngine,
        IProductService productService,
        IProviderService providerService,
        ILogger<SyncController> logger)
    {
        _syncEngine = syncEngine;
        _productService = productService;
        _providerService = providerService;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/sync/digiflazz
    /// Triggers Digiflazz-only product synchronization.
    /// Protected by X-Webhook-Secret header.
    /// </summary>
    [HttpPost("digiflazz")]
    public async Task<IActionResult> SyncDigiflazz()
    {
        if (!ValidateSecret())
        {
            _logger.LogWarning("Unauthorized sync attempt from {IP}", HttpContext.Connection.RemoteIpAddress);
            return Unauthorized(new { success = false, message = "Invalid or missing X-Webhook-Secret header." });
        }

        _logger.LogInformation("Authorized Digiflazz sync triggered.");
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
    /// Protected by X-Webhook-Secret header.
    /// </summary>
    [HttpPost("vip")]
    public async Task<IActionResult> SyncVip()
    {
        if (!ValidateSecret())
        {
            return Unauthorized(new { success = false, message = "Invalid or missing X-Webhook-Secret header." });
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
    /// Protected by X-Webhook-Secret header.
    /// </summary>
    [HttpPost("all")]
    public async Task<IActionResult> SyncAll()
    {
        if (!ValidateSecret())
        {
            return Unauthorized(new { success = false, message = "Invalid or missing X-Webhook-Secret header." });
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
    /// Check Digiflazz deposit balance. Protected.
    /// </summary>
    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance()
    {
        if (!ValidateSecret())
        {
            return Unauthorized(new { success = false, message = "Invalid or missing X-Webhook-Secret header." });
        }

        var balance = await _providerService.GetDigiflazzBalanceAsync();
        return Ok(new
        {
            success = balance.IsSuccess,
            balance = balance.Balance,
            message = balance.Message
        });
    }

    private bool ValidateSecret()
    {
        return Request.Headers.TryGetValue("X-Webhook-Secret", out var secretToken)
               && secretToken == WEBHOOK_SECRET;
    }
}

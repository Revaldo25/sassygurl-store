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
[Authorize(Roles = "SUPERADMIN,ADMIN")]
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
    /// <param name="webhookSecret">The secret key for authorization.</param>
    /// <param name="idempotencyKey">Optional idempotency key for safe retries.</param>
    [HttpPost("digiflazz")]
    public async Task<IActionResult> SyncDigiflazz(
        [FromHeader(Name = "X-Webhook-Secret")][Required] string webhookSecret,
        [FromHeader(Name = "X-Idempotency-Key")] string? idempotencyKey = null)
    {
        if (webhookSecret != WEBHOOK_SECRET)
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
        if (webhookSecret != WEBHOOK_SECRET)
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
        if (webhookSecret != WEBHOOK_SECRET)
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
        if (webhookSecret != WEBHOOK_SECRET)
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
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SassyGurl.Api.DTOs.Catalog;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Services;
using System.Security.Claims;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CatalogController : ControllerBase
{
    private readonly ICatalogService _catalogService;

    public CatalogController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    private string GetUserRole() => User.Identity?.IsAuthenticated == true
        ? User.FindFirst(ClaimTypes.Role)?.Value ?? "MEMBER"
        : "MEMBER";

    // ── GET /api/catalog/games ────────────────────────────────────────────
    [HttpGet("games")]
    public async Task<ActionResult<ApiResponse<List<GameDto>>>> GetGames()
    {
        var result = await _catalogService.GetAllGamesAsync();
        return Ok(result);
    }

    // ── GET /api/catalog/games/{slug} ────────────────────────────────────
    /// <summary>
    /// Full game detail with both flat products and grouped products.
    /// Response includes: game info, ItemCategories[], GroupedProducts[], Products[].
    /// Used by the Ditusi-style game page.
    /// </summary>
    [HttpGet("games/{slug}")]
    public async Task<ActionResult<ApiResponse<GameDetailDto>>> GetGameDetail(string slug)
    {
        var result = await _catalogService.GetGameWithProductsAsync(slug, GetUserRole());
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // ── GET /api/catalog/payments ─────────────────────────────────────────
    [HttpGet("payments")]
    public async Task<ActionResult<ApiResponse<List<PaymentMethodDto>>>> GetPayments()
    {
        var result = await _catalogService.GetActivePaymentMethodsAsync();
        return Ok(result);
    }

    // ── GET /api/catalog/payments/grouped ────────────────────────────────
    /// <summary>
    /// Payment methods grouped by type for Ditusi-style accordion UI.
    /// Returns: [{ groupKey, groupLabel, countryFlag, methods[] }]
    /// </summary>
    [HttpGet("payments/grouped")]
    public async Task<ActionResult<ApiResponse<List<PaymentGroupDto>>>> GetGroupedPayments()
    {
        var result = await _catalogService.GetGroupedPaymentMethodsAsync();
        return Ok(result);
    }

    // ── GET /api/catalog/providers/status ────────────────────────────────
    [HttpGet("providers/status")]
    public async Task<ActionResult<ApiResponse<List<ProviderStatusDto>>>> GetProviderStatus()
    {
        var result = await _catalogService.GetProviderStatusesAsync();
        return Ok(result);
    }

    // ── ADMIN CRUD ────────────────────────────────────────────────────────
    
    [Authorize(Roles = "SUPERADMIN,OWNER")]
    [HttpPost("games")]
    public async Task<ActionResult<ApiResponse<GameDto>>> CreateGame([FromBody] GameCreateDto dto)
    {
        var result = await _catalogService.CreateGameAsync(dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "SUPERADMIN,OWNER")]
    [HttpPut("games/{id}")]
    public async Task<ActionResult<ApiResponse<GameDto>>> UpdateGame(string id, [FromBody] GameUpdateDto dto)
    {
        var result = await _catalogService.UpdateGameAsync(id, dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "SUPERADMIN,OWNER")]
    [HttpDelete("games/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteGame(string id)
    {
        var result = await _catalogService.DeleteGameAsync(id);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

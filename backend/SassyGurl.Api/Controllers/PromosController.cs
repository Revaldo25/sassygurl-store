using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Services;
using System.Security.Claims;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PromosController : ControllerBase
{
    private readonly IPromoService _promoService;
    private readonly IAuditService _auditService;

    public PromosController(IPromoService promoService, IAuditService auditService)
    {
        _promoService = promoService;
        _auditService = auditService;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";

    /// <summary>
    /// Validate a promo code (public — used during checkout).
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<ApiResponse<PromoResultDto>>> Validate([FromBody] ValidatePromoRequestDto dto)
    {
        var result = await _promoService.ValidatePromoAsync(dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Get all promos (Admin only — Marketing Suite).
    /// </summary>
    [Authorize(Roles = "SUPERADMIN,CS,FINANCE")]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<PromoDto>>>> GetAll()
    {
        var result = await _promoService.GetAllPromosAsync();
        return Ok(result);
    }

    /// <summary>
    /// Create a new promo/flash sale (Admin only).
    /// </summary>
    [Authorize(Roles = "SUPERADMIN,FINANCE")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<PromoDto>>> Create([FromBody] CreatePromoDto dto)
    {
        var result = await _promoService.CreatePromoAsync(dto);
        if (!result.Success) return BadRequest(result);

        await _auditService.LogAsync(GetUserId(), "CREATE_PROMO", "Promo", result.Data!.Id,
            newValues: dto, ip: HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Update an existing promo (Admin only).
    /// </summary>
    [Authorize(Roles = "SUPERADMIN,FINANCE")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<PromoDto>>> Update(string id, [FromBody] CreatePromoDto dto)
    {
        var result = await _promoService.UpdatePromoAsync(id, dto);
        if (!result.Success) return NotFound(result);

        await _auditService.LogAsync(GetUserId(), "UPDATE_PROMO", "Promo", id,
            newValues: dto, ip: HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Toggle promo active/inactive (Admin only).
    /// </summary>
    [Authorize(Roles = "SUPERADMIN,FINANCE")]
    [HttpPatch("{id}/toggle")]
    public async Task<ActionResult<ApiResponse<string>>> Toggle(string id)
    {
        var result = await _promoService.TogglePromoAsync(id);
        if (!result.Success) return NotFound(result);

        await _auditService.LogAsync(GetUserId(), "TOGGLE_PROMO", "Promo", id,
            ip: HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Delete a promo (SUPERADMIN only).
    /// </summary>
    [Authorize(Roles = "SUPERADMIN")]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(string id)
    {
        var result = await _promoService.DeletePromoAsync(id);
        if (!result.Success) return NotFound(result);

        await _auditService.LogAsync(GetUserId(), "DELETE_PROMO", "Promo", id,
            ip: HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(result);
    }
}

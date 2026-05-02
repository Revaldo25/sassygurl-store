using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Services;
using System.Security.Claims;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SUPERADMIN")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly IAuditService _auditService;

    public SettingsController(ISettingsService settingsService, IAuditService auditService)
    {
        _settingsService = settingsService;
        _auditService = auditService;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";

    /// <summary>
    /// Get all system settings (Owner only).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SettingDto>>>> GetAll()
    {
        var result = await _settingsService.GetAllAsync();
        return Ok(result);
    }

    /// <summary>
    /// Update a setting (Smart Markup, Admin Fee, Active Provider, etc.)
    /// </summary>
    [HttpPut]
    public async Task<ActionResult<ApiResponse<SettingDto>>> Update([FromBody] UpdateSettingDto dto)
    {
        var adminId = GetUserId();

        // Get old value for audit
        var oldVal = await _settingsService.GetValueAsync(dto.Key);

        var result = await _settingsService.UpsertAsync(dto.Key, dto.Value, adminId);
        if (!result.Success) return BadRequest(result);

        await _auditService.LogAsync(adminId, "UPDATE_SETTING", "SystemSetting", dto.Key,
            oldValues: new { key = dto.Key, value = oldVal.Data },
            newValues: new { key = dto.Key, value = dto.Value },
            ip: HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(result);
    }

    /// <summary>
    /// Quick switch active provider (Digiflazz / Antigravity).
    /// </summary>
    [HttpPatch("provider/{providerName}")]
    public async Task<ActionResult<ApiResponse<SettingDto>>> SwitchProvider(string providerName)
    {
        if (providerName is not ("Digiflazz" or "Antigravity"))
            return BadRequest(ApiResponse<SettingDto>.Fail("Invalid provider. Use 'Digiflazz' or 'Antigravity'."));

        var adminId = GetUserId();
        var result = await _settingsService.UpsertAsync(SettingKeys.ActiveProvider, providerName, adminId,
            "Currently active top-up provider");

        await _auditService.LogAsync(adminId, "SWITCH_PROVIDER", "SystemSetting", SettingKeys.ActiveProvider,
            newValues: new { provider = providerName },
            ip: HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(result);
    }
}

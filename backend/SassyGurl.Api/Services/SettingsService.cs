using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Services;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public class SettingDto
{
    public string Key { get; set; } = null!;
    public string Value { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateSettingDto
{
    public string Key { get; set; } = null!;
    public string Value { get; set; } = null!;
}

// ── Well-Known Setting Keys ─────────────────────────────────────────────────

public static class SettingKeys
{
    public const string GlobalMarginPercent = "global_margin_percent";
    public const string AdminFeeFlat = "admin_fee_flat";
    public const string WhatsAppEnabled = "whatsapp_enabled";
    public const string ActiveProvider = "active_provider";
}

// ── Interface ────────────────────────────────────────────────────────────────

public interface ISettingsService
{
    Task<ApiResponse<List<SettingDto>>> GetAllAsync();
    Task<ApiResponse<string>> GetValueAsync(string key);
    Task<ApiResponse<SettingDto>> UpsertAsync(string key, string value, string adminId, string? description = null);
    Task<decimal> GetMarginPercent();
    Task<decimal> GetAdminFee();
    Task<string> GetActiveProvider();
}

// ── Implementation ───────────────────────────────────────────────────────────

public class SettingsService : ISettingsService
{
    private readonly SassyGurlDbContext _context;

    public SettingsService(SassyGurlDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<SettingDto>>> GetAllAsync()
    {
        var settings = await _context.SystemSettings
            .AsNoTracking()
            .OrderBy(s => s.Key)
            .Select(s => new SettingDto
            {
                Key = s.Key,
                Value = s.Value,
                Description = s.Description,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync();

        return ApiResponse<List<SettingDto>>.Ok(settings);
    }

    public async Task<ApiResponse<string>> GetValueAsync(string key)
    {
        var setting = await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == key);

        if (setting == null)
            return ApiResponse<string>.Fail($"Setting '{key}' not found.");

        return ApiResponse<string>.Ok(setting.Value);
    }

    public async Task<ApiResponse<SettingDto>> UpsertAsync(string key, string value, string adminId, string? description = null)
    {
        var setting = await _context.SystemSettings.FindAsync(key);

        if (setting == null)
        {
            setting = new SystemSetting
            {
                Key = key,
                Value = value,
                Description = description,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = adminId
            };
            _context.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = value;
            setting.UpdatedAt = DateTime.UtcNow;
            setting.UpdatedBy = adminId;
            if (description != null) setting.Description = description;
        }

        await _context.SaveChangesAsync();

        return ApiResponse<SettingDto>.Ok(new SettingDto
        {
            Key = setting.Key,
            Value = setting.Value,
            Description = setting.Description,
            UpdatedAt = setting.UpdatedAt
        }, "Setting saved.");
    }

    public async Task<decimal> GetMarginPercent()
    {
        var val = await _context.SystemSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == SettingKeys.GlobalMarginPercent);
        return val != null && decimal.TryParse(val.Value, out var pct) ? pct : 3m; // Default 3%
    }

    public async Task<decimal> GetAdminFee()
    {
        var val = await _context.SystemSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == SettingKeys.AdminFeeFlat);
        return val != null && decimal.TryParse(val.Value, out var fee) ? fee : 0m;
    }

    public async Task<string> GetActiveProvider()
    {
        var val = await _context.SystemSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == SettingKeys.ActiveProvider);
        return val?.Value ?? "Digiflazz";
    }
}

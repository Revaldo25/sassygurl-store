using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;
using SassyGurl.Api.Services;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
// [Authorize(Roles = "SUPERADMIN,ADMIN")]
public class AdminFlashSaleController : ControllerBase
{
    private readonly SassyGurlDbContext _context;

    public AdminFlashSaleController(SassyGurlDbContext context)
    {
        _context = context;
    }

    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "FlashSaleConfig");
        if (setting == null || string.IsNullOrEmpty(setting.Value))
        {
            return Ok(new { success = true, data = new FlashSaleConfig() });
        }

        var config = JsonSerializer.Deserialize<FlashSaleConfig>(setting.Value, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        return Ok(new { success = true, data = config });
    }

    [HttpPost("config")]
    public async Task<IActionResult> UpdateConfig([FromBody] FlashSaleConfig req)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "FlashSaleConfig");
        var jsonValue = JsonSerializer.Serialize(req);

        if (setting == null)
        {
            _context.SystemSettings.Add(new SystemSetting
            {
                Key = "FlashSaleConfig",
                Value = jsonValue,
                Description = "Configuration for daily automated Flash Sale",
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = "Admin"
            });
        }
        else
        {
            setting.Value = jsonValue;
            setting.UpdatedAt = DateTime.UtcNow;
            setting.UpdatedBy = "Admin";
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Flash Sale configuration updated. It will apply on the next minute tick." });
    }
}

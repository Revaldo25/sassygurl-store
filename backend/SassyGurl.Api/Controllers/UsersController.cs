using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SUPERADMIN,OWNER,FINANCE,CS")]
public class UsersController : ControllerBase
{
    private readonly SassyGurlDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(SassyGurlDbContext context, ILogger<UsersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetUsers(
        [FromQuery] string search = "",
        [FromQuery] int page = 1,
        [FromQuery] int limit = 15)
    {
        var query = _context.Users.AsQueryable();

        // ── VISIBILITY LOCK: Karantina Data untuk Admin Bawah ──
        if (User.IsInRole("CS") || User.IsInRole("FINANCE"))
        {
            query = query.Where(u => (int)u.Role <= 2);
        }
        else if (User.IsInRole("SUPERADMIN") && !User.IsInRole("OWNER"))
        {
            // SUPERADMIN tidak bisa melihat OWNER
            query = query.Where(u => (int)u.Role < 6);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u => (u.Email != null && u.Email.ToLower().Contains(s)) || 
                                   (u.Name != null && u.Name.ToLower().Contains(s)));
        }

        var total = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.Name,
                Role = u.Role.ToString(),
                u.Balance,
                u.Points,
                IsBanned = u.KycStatus == SassyGurl.Api.Models.Enums.KycStatus.BANNED,
                u.KycStatus
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(new { data = users, total, page, limit }));
    }

    [Authorize(Roles = "SUPERADMIN,OWNER")]
    [HttpPatch("{id}/role")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateRole(string id, [FromBody] UpdateRoleRequest req)
    {
        var actingRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(ApiResponse<string>.Fail("User not found"));

        if (user.Role.ToString() == "OWNER")
            return BadRequest(ApiResponse<string>.Fail("Cannot modify OWNER."));

        if (actingRole != "OWNER" && req.Role == "OWNER")
            return BadRequest(ApiResponse<string>.Fail("Only OWNER can promote to OWNER."));

        if (actingRole != "OWNER" && req.Role == "SUPERADMIN")
            return BadRequest(ApiResponse<string>.Fail("Only OWNER can promote to SUPERADMIN."));

        if (actingRole != "OWNER" && user.Role.ToString() == "SUPERADMIN")
            return BadRequest(ApiResponse<string>.Fail("Only OWNER can modify a SUPERADMIN."));

        if (Enum.TryParse<SassyGurl.Api.Models.Enums.Role>(req.Role, out var roleEnum))
        {
            user.Role = roleEnum;
            await _context.SaveChangesAsync();
            _logger.LogInformation("User {Id} role updated to {Role} by {ActingRole}", id, req.Role, actingRole);
            return Ok(ApiResponse<string>.Ok("Role updated successfully"));
        }
        
        return BadRequest(ApiResponse<string>.Fail("Invalid role"));
    }

    [Authorize(Roles = "SUPERADMIN,OWNER,CS")]
    [HttpPatch("{id}/ban")]
    public async Task<ActionResult<ApiResponse<string>>> ToggleBan(string id, [FromBody] ToggleBanRequest req)
    {
        var actingRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(ApiResponse<string>.Fail("User not found"));

        if (user.Role.ToString() == "OWNER")
            return BadRequest(ApiResponse<string>.Fail("Cannot ban OWNER."));

        if (actingRole != "OWNER" && user.Role.ToString() == "SUPERADMIN")
            return BadRequest(ApiResponse<string>.Fail("Only OWNER can ban a SUPERADMIN."));

        if (actingRole == "CS" && (user.Role.ToString() == "FINANCE" || user.Role.ToString() == "CS"))
            return BadRequest(ApiResponse<string>.Fail("CS can only ban MEMBER, RESELLER, VIP."));

        if (req.IsBanned) {
            user.KycStatus = SassyGurl.Api.Models.Enums.KycStatus.BANNED;
        } else {
            user.KycStatus = SassyGurl.Api.Models.Enums.KycStatus.UNVERIFIED;
        }
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {Id} ban status updated to {IsBanned} by {ActingRole}", id, req.IsBanned, actingRole);
        return Ok(ApiResponse<string>.Ok($"User {(req.IsBanned ? "banned" : "unbanned")} successfully"));
    }
}

public class UpdateRoleRequest { public string Role { get; set; } = null!; }
public class ToggleBanRequest { public bool IsBanned { get; set; } }

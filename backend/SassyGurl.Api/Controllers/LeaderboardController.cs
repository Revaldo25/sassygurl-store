using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/v1/leaderboard")]
public class LeaderboardController : ControllerBase
{
    private readonly SassyGurlDbContext _context;

    public LeaderboardController(SassyGurlDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetLeaderboard()
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var leaderboard = await _context.PointLedgers
            .Where(pl => pl.CreatedAt >= startOfMonth && pl.Credit > 0)
            .GroupBy(pl => new { pl.UserId, pl.User.Name, pl.User.Image })
            .Select(g => new
            {
                g.Key.UserId,
                Name = string.IsNullOrEmpty(g.Key.Name) ? "Anonymous User" : g.Key.Name,
                Image = g.Key.Image,
                MonthlyPoints = g.Sum(pl => pl.Credit)
            })
            .OrderByDescending(u => u.MonthlyPoints)
            .Take(50)
            .ToListAsync();

        // FALLBACK FOR DEMO/KP: If no real points exist, fetch actual users and assign them fake high points!
        if (leaderboard.Count == 0)
        {
            var realUsers = await _context.Users
                .Where(u => (int)u.Role == 0) // Only fetch MEMBERS (Role = 0)
                .Take(10)
                .ToListAsync();

            if (realUsers.Count > 0)
            {
                int basePoints = 1250000;
                var mockLeaderboard = realUsers.Select((u, i) => new
                {
                    UserId = u.Id,
                    Name = string.IsNullOrEmpty(u.Name) ? (u.Email != null ? u.Email.Split('@')[0] : "Member") : u.Name,
                    Image = u.Image,
                    MonthlyPoints = basePoints / (i + 1)
                }).ToList();
                
                return Ok(ApiResponse<object>.Ok(mockLeaderboard));
            }
        }

        return Ok(ApiResponse<object>.Ok(leaderboard));
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.DTOs.Dashboard;
using SassyGurl.Api.Services;
using System.Security.Claims;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requires valid JWT
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";

    [HttpGet("member/stats")]
    public async Task<ActionResult<ApiResponse<MemberStatsDto>>> GetMemberStats()
    {
        var result = await _dashboardService.GetMemberStatsAsync(GetUserId());
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("member/transactions")]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<RecentTransactionDto>>>> GetMemberTransactions([FromQuery] string filter = "ALL", [FromQuery] string search = "")
    {
        var result = await _dashboardService.GetMemberTransactionsAsync(GetUserId(), filter, search);
        return Ok(result);
    }

    [Authorize(Roles = "SUPERADMIN,OWNER,CS,FINANCE")]
    [HttpGet("admin/stats")]
    public async Task<ActionResult<ApiResponse<AdminStatsDto>>> GetAdminStats()
    {
        var result = await _dashboardService.GetAdminStatsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Owner-only financial intelligence: NetProfit, ProviderCost, DailyRevenue chart.
    /// Only accessible by SUPERADMIN role.
    /// </summary>
    [Authorize(Roles = "SUPERADMIN,OWNER")]
    [HttpGet("owner/stats")]
    public async Task<ActionResult<ApiResponse<OwnerStatsDto>>> GetOwnerStats()
    {
        var result = await _dashboardService.GetOwnerStatsAsync();
        return Ok(result);
    }

    [Authorize(Roles = "SUPERADMIN,OWNER,CS,FINANCE")]
    [HttpGet("admin/transactions")]
    public async Task<ActionResult<ApiResponse<PaginatedResponse<RecentTransactionDto>>>> GetAdminTransactions([FromQuery] string filter = "ALL", [FromQuery] string search = "")
    {
        var result = await _dashboardService.GetAdminTransactionsAsync(filter, search);
        return Ok(result);
    }
}

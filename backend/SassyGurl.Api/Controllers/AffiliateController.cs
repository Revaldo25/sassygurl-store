using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models;
using System.Security.Claims;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/v1/affiliate")]
[Authorize]
public class AffiliateController : ControllerBase
{
    private readonly SassyGurlDbContext _context;
    private readonly ILogger<AffiliateController> _logger;

    public AffiliateController(SassyGurlDbContext context, ILogger<AffiliateController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _context.Users
            .Include(u => u.Referees)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return NotFound("User not found");

        var totalReferrals = user.Referees.Count;
        
        var totalCommission = await _context.AffiliateCommissions
            .Where(c => c.AffiliateUserId == userId)
            .SumAsync(c => c.Amount);

        var recentCommissions = await _context.AffiliateCommissions
            .Include(c => c.Transaction)
            .ThenInclude(t => t.Product)
            .Where(c => c.AffiliateUserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Take(10)
            .Select(c => new
            {
                c.Id,
                c.Amount,
                c.CreatedAt,
                TransactionInvoice = c.Transaction.InvoiceId,
                ProductName = c.Transaction.Product.Name
            })
            .ToListAsync();

        var recentReferrals = user.Referees
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Email,
                r.CreatedAt
            })
            .ToList();

        var dashboardData = new
        {
            user.ReferralCode,
            AvailableBalance = user.Balance,
            TotalCommission = totalCommission,
            TotalReferrals = totalReferrals,
            RecentCommissions = recentCommissions,
            RecentReferrals = recentReferrals
        };

        return Ok(ApiResponse<object>.Ok(dashboardData));
    }

    [HttpPost("withdraw")]
    public async Task<IActionResult> RequestWithdrawal([FromBody] WithdrawalRequestDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found");

        if (dto.Amount < 50000)
            return BadRequest(ApiResponse<string>.Fail("Minimum withdrawal is Rp 50.000"));

        if (user.Balance < dto.Amount)
            return BadRequest(ApiResponse<string>.Fail("Insufficient balance"));

        // Deduct balance
        user.Balance -= dto.Amount;

        var request = new WithdrawalRequest
        {
            UserId = userId,
            Amount = dto.Amount,
            BankName = dto.BankName,
            AccountName = dto.AccountName,
            AccountNumber = dto.AccountNumber,
            Status = "PENDING"
        };

        _context.WithdrawalRequests.Add(request);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} requested withdrawal of {Amount}", userId, dto.Amount);

        return Ok(ApiResponse<object>.Ok(new { request.Id, request.Status }, "Withdrawal request submitted successfully"));
    }
}

public class WithdrawalRequestDto
{
    public decimal Amount { get; set; }
    public string BankName { get; set; } = null!;
    public string AccountNumber { get; set; } = null!;
    public string AccountName { get; set; } = null!;
}

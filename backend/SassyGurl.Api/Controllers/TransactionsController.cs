using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.DTOs.Transaction;
using SassyGurl.Api.Services;
using System.Security.Claims;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    private string? GetUserId() => User.Identity?.IsAuthenticated == true 
        ? User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
        : null;

    [HttpPost]
    public async Task<ActionResult<ApiResponse<TransactionResponseDto>>> CreateTransaction([FromBody] CreateTransactionDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Invalid request data"));

        var result = await _transactionService.CreateTransactionAsync(request, GetUserId());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [Authorize(Roles = "SUPERADMIN,CS")]
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateStatus(string id, [FromBody] UpdateTransactionStatusDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Invalid status data"));

        var result = await _transactionService.UpdateTransactionStatusAsync(id, request.Status);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("recent")]
    public async Task<ActionResult<ApiResponse<List<SassyGurl.Api.Hubs.PublicTransactionPayload>>>> GetRecentTransactions(
        [FromServices] SassyGurl.Api.Data.SassyGurlDbContext db)
    {
        var recent = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
            System.Linq.Queryable.Take(
                System.Linq.Queryable.OrderByDescending(
                    System.Linq.Queryable.Where(db.Transactions.Include(t => t.Game), t => t.OrderStatus == SassyGurl.Api.Models.Enums.OrderStatus.SUCCESS),
                    t => t.CompletedAt
                ),
                10
            )
        );

        var payload = recent.Select(t => new SassyGurl.Api.Hubs.PublicTransactionPayload(
            string.IsNullOrEmpty(t.Whatsapp) ? "User" : t.Whatsapp.Substring(0, Math.Min(4, t.Whatsapp.Length)) + "***",
            t.Game != null ? t.Game.Name : "Game",
            t.DenomName ?? "Item",
            t.CompletedAt ?? DateTime.UtcNow
        )).ToList();

        return Ok(ApiResponse<List<SassyGurl.Api.Hubs.PublicTransactionPayload>>.Ok(payload, "OK"));
    }
}

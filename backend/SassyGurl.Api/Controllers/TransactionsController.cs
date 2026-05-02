using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
}

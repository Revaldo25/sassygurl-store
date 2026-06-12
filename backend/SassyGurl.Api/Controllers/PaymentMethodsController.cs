using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentMethodsController : ControllerBase
{
    private readonly SassyGurlDbContext _context;

    public PaymentMethodsController(SassyGurlDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetAll()
    {
        var methods = await _context.PaymentMethods
            .OrderBy(p => p.Type)
            .ThenBy(p => p.Code)
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(methods));
    }

    [Authorize(Roles = "SUPERADMIN,OWNER,FINANCE")]
    [HttpPatch("{id}/fee")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateFee(string id, [FromBody] UpdateFeeRequest req)
    {
        var method = await _context.PaymentMethods.FindAsync(id);
        if (method == null) return NotFound(ApiResponse<string>.Fail("Payment method not found"));

        method.FeeFlat = req.FeeFlat;
        method.FeePercent = req.FeePercent;
        
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok("Fee updated successfully"));
    }

    [Authorize(Roles = "SUPERADMIN,OWNER,FINANCE")]
    [HttpPatch("{id}/toggle")]
    public async Task<ActionResult<ApiResponse<string>>> ToggleActive(string id, [FromBody] ToggleActiveRequest req)
    {
        var method = await _context.PaymentMethods.FindAsync(id);
        if (method == null) return NotFound(ApiResponse<string>.Fail("Payment method not found"));

        method.IsActive = req.IsActive;
        
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<string>.Ok($"Payment method {(req.IsActive ? "enabled" : "disabled")} successfully"));
    }
}

public class UpdateFeeRequest 
{ 
    public decimal FeeFlat { get; set; } 
    public decimal FeePercent { get; set; } 
}

public class ToggleActiveRequest 
{ 
    public bool IsActive { get; set; } 
}

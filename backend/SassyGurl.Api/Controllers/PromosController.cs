using Microsoft.AspNetCore.Mvc;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Services;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PromosController : ControllerBase
{
    private readonly IPromoService _promoService;

    public PromosController(IPromoService promoService)
    {
        _promoService = promoService;
    }

    /// <summary>
    /// Validate a promo code and calculate discount
    /// </summary>
    [HttpPost("validate")]
    public async Task<IActionResult> ValidatePromo([FromBody] ValidatePromoRequestDto request)
    {
        var result = await _promoService.ValidatePromoAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}

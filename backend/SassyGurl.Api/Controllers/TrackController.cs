using Microsoft.AspNetCore.Mvc;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.DTOs.Transaction;
using SassyGurl.Api.Services;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrackController : ControllerBase
{
    private readonly ITrackService _trackService;

    public TrackController(ITrackService trackService)
    {
        _trackService = trackService;
    }

    /// <summary>
    /// Track an order by Invoice ID
    /// </summary>
    [HttpGet("{invoiceId}")]
    public async Task<IActionResult> TrackOrder(string invoiceId)
    {
        var result = await _trackService.TrackOrderAsync(invoiceId);
        return result.Success ? Ok(result) : NotFound(result);
    }
}

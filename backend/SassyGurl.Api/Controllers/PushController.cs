using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PushController : ControllerBase
{
    private readonly SassyGurlDbContext _db;

    public PushController(SassyGurlDbContext db)
    {
        _db = db;
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] PushSubscriptionRequest request)
    {
        // Simple distinct endpoint check
        var exists = await _db.PushSubscriptions.AnyAsync(x => x.Endpoint == request.Endpoint);
        if (!exists)
        {
            _db.PushSubscriptions.Add(new PushSubscription
            {
                Endpoint = request.Endpoint,
                P256dh = request.Keys.P256dh,
                Auth = request.Keys.Auth,
                // userId can be linked if user is authenticated
                UserId = User.Identity?.Name ?? "anonymous"
            });
            await _db.SaveChangesAsync();
        }

        return Ok(new { success = true });
    }
}

public class PushSubscriptionRequest
{
    public string Endpoint { get; set; } = string.Empty;
    public PushKeys Keys { get; set; } = new();
}

public class PushKeys
{
    public string P256dh { get; set; } = string.Empty;
    public string Auth { get; set; } = string.Empty;
}

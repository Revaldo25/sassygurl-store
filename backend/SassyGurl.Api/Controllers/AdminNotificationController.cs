using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SUPERADMIN,ADMIN")]
public class AdminNotificationController : ControllerBase
{
    private readonly SassyGurlDbContext _context;

    public AdminNotificationController(SassyGurlDbContext context)
    {
        _context = context;
    }

    [HttpPost("blast")]
    public async Task<IActionResult> StartBlast([FromBody] BlastRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Message))
            return BadRequest(new { success = false, message = "Pesan tidak boleh kosong." });

        var users = await _context.Users
            .Where(u => !string.IsNullOrEmpty(u.Phone))
            .Select(u => new { u.Phone, u.Name })
            .ToListAsync();

        if (!users.Any())
            return Ok(new { success = false, message = "Tidak ada pengguna dengan nomor HP yang valid." });

        var queues = new List<NotificationQueue>();
        foreach (var user in users)
        {
            var personalizedMsg = req.Message.Replace("{Nama}", user.Name ?? "Kak");
            
            queues.Add(new NotificationQueue
            {
                TargetPhone = user.Phone!,
                Message = personalizedMsg,
                Status = "PENDING",
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.NotificationQueues.AddRange(queues);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = $"Berhasil menambahkan {queues.Count} pesan ke antrean pengiriman." });
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetQueueStatus()
    {
        var total = await _context.NotificationQueues.CountAsync();
        var pending = await _context.NotificationQueues.CountAsync(q => q.Status == "PENDING");
        var sent = await _context.NotificationQueues.CountAsync(q => q.Status == "SENT");
        var failed = await _context.NotificationQueues.CountAsync(q => q.Status == "FAILED");

        return Ok(new
        {
            success = true,
            data = new
            {
                Total = total,
                Pending = pending,
                Sent = sent,
                Failed = failed
            }
        });
    }
}

public class BlastRequest
{
    public string Message { get; set; } = string.Empty;
}

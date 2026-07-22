using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LiveChatController : ControllerBase
{
    private readonly SassyGurlDbContext _dbContext;

    public LiveChatController(SassyGurlDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // GET /api/livechat/sessions
    // Admin only: Get all active sessions
    [HttpGet("sessions")]
    [Authorize(Roles = "SUPERADMIN,CS")]
    public async Task<IActionResult> GetActiveSessions()
    {
        var sessions = await _dbContext.ChatSessions
            .Where(s => s.Status == "Active")
            .OrderByDescending(s => s.LastUpdatedAt)
            .Select(s => new
            {
                s.Id,
                s.GuestName,
                s.UserId,
                s.Status,
                s.LastUpdatedAt,
                UnreadCount = s.Messages.Count(m => !m.IsRead && m.SenderRole == "Customer"),
                LastMessage = s.Messages.OrderByDescending(m => m.Timestamp).FirstOrDefault()
            })
            .ToListAsync();

        return Ok(sessions);
    }

    // GET /api/livechat/{sessionId}
    // Get chat history for a session
    [HttpGet("{sessionId}")]
    public async Task<IActionResult> GetChatHistory(string sessionId)
    {
        var messages = await _dbContext.ChatMessages
            .Where(m => m.ChatSessionId == sessionId)
            .OrderBy(m => m.Timestamp)
            .Select(m => new
            {
                m.Id,
                m.SenderRole,
                m.MessageText,
                m.Timestamp,
                m.IsRead
            })
            .ToListAsync();

        return Ok(messages);
    }
}

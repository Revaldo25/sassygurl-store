using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SassyGurl.Api.Hubs;
using SassyGurl.Api.Services;
using SassyGurl.Domain.Entities;
using SassyGurl.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/whatsapp")]
public class WhatsAppWebhookController : ControllerBase
{
    private readonly IAiSupportService _aiSupportService;
    private readonly IWhatsAppService _whatsappService;
    private readonly SassyGurlDbContext _dbContext;
    private readonly IHubContext<SupportHub> _hubContext;
    private readonly ILogger<WhatsAppWebhookController> _logger;

    public WhatsAppWebhookController(
        IAiSupportService aiSupportService,
        IWhatsAppService whatsappService,
        SassyGurlDbContext dbContext,
        IHubContext<SupportHub> hubContext,
        ILogger<WhatsAppWebhookController> logger)
    {
        _aiSupportService = aiSupportService;
        _whatsappService = whatsappService;
        _dbContext = dbContext;
        _hubContext = hubContext;
        _logger = logger;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> ReceiveWebhook([FromForm] FonnteWebhookPayload payload)
    {
        if (string.IsNullOrEmpty(payload.Sender) || string.IsNullOrEmpty(payload.Message))
            return Ok();

        _logger.LogInformation("Received WA from {Sender}: {Message}", payload.Sender, payload.Message);

        var sessionId = $"WA-{payload.Sender}"; // Use phone number as Session ID

        // Find or create session
        var session = await _dbContext.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session == null)
        {
            session = new ChatSession
            {
                Id = sessionId,
                GuestName = payload.Name ?? payload.Sender,
                Channel = "WhatsApp"
            };
            _dbContext.ChatSessions.Add(session);
        }

        // Add user message
        var userMsg = new ChatMessage
        {
            ChatSessionId = sessionId,
            MessageText = payload.Message,
            SenderRole = "Customer",
            Timestamp = DateTime.UtcNow
        };
        session.LastUpdatedAt = DateTime.UtcNow;
        _dbContext.ChatMessages.Add(userMsg);
        await _dbContext.SaveChangesAsync();

        // Broadcast to Command Center
        await _hubContext.Clients.Group("cs_agents").SendAsync("ReceiveSupportMessage", sessionId, userMsg.Id, "Customer", userMsg.MessageText, userMsg.Timestamp);

        // Get AI Reply
        try
        {
            var history = await _dbContext.ChatMessages
                .Where(m => m.ChatSessionId == sessionId)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            var aiReply = await _aiSupportService.GetReplyAsync("WhatsApp", sessionId, payload.Message, history);
            
            // Send to WA
            await _whatsappService.SendMessageAsync(payload.Sender, aiReply);

            // Save AI message to DB
            var aiMessage = new ChatMessage
            {
                ChatSessionId = sessionId,
                MessageText = aiReply,
                SenderRole = "Admin", // AI acts as Admin
                Timestamp = DateTime.UtcNow
            };
            session.LastUpdatedAt = DateTime.UtcNow;
            _dbContext.ChatMessages.Add(aiMessage);
            await _dbContext.SaveChangesAsync();

            // Broadcast AI reply to Command Center so Admin sees it
            await _hubContext.Clients.Group("cs_agents").SendAsync("ReceiveSupportMessage", sessionId, aiMessage.Id, "Admin", aiReply, aiMessage.Timestamp);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process WA AI Reply");
        }

        return Ok();
    }
}

public class FonnteWebhookPayload
{
    public string? Device { get; set; }
    public string? Sender { get; set; }
    public string? Message { get; set; }
    public string? Name { get; set; }
}

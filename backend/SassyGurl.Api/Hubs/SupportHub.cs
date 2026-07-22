using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SassyGurl.Api.Data;
using SassyGurl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Services;

namespace SassyGurl.Api.Hubs;

/// <summary>
/// Real-Time Support Hub for SassyGurl Live Chat.
/// Handles customer service messaging between users and admins.
/// </summary>
[AllowAnonymous]
public class SupportHub : Hub
{
    private readonly ILogger<SupportHub> _logger;
    private readonly SassyGurlDbContext _dbContext;
    private readonly IAiSupportService _aiSupportService;
    private readonly IWhatsAppService _whatsappService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    public SupportHub(
        ILogger<SupportHub> logger, 
        SassyGurlDbContext dbContext, 
        IAiSupportService aiSupportService,
        IWhatsAppService whatsappService,
        IHttpClientFactory httpClientFactory,
        IConfiguration config)
    {
        _logger = logger;
        _dbContext = dbContext;
        _aiSupportService = aiSupportService;
        _whatsappService = whatsappService;
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    public override async Task OnConnectedAsync()
    {
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        if (role is "SUPERADMIN" or "CS")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "cs_agents");
            _logger.LogInformation("CS Agent connected to Support Hub: {ConnectionId}", Context.ConnectionId);
        }
        else
        {
            _logger.LogInformation("Customer connected to Support Hub: {ConnectionId}", Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinSession(string sessionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
        _logger.LogInformation("Client {ConnectionId} joined session {SessionId}", Context.ConnectionId, sessionId);
    }

    public async Task SendMessageToAdmin(string sessionId, string messageText, string guestName = "Guest")
    {
        _logger.LogInformation("Message from {SessionId}: {Message}", sessionId, messageText);
        
        var session = await _dbContext.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session == null)
        {
            session = new ChatSession
            {
                Id = sessionId,
                GuestName = guestName,
                UserId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            };
            _dbContext.ChatSessions.Add(session);
        }

        var message = new ChatMessage
        {
            ChatSessionId = sessionId,
            MessageText = messageText,
            SenderRole = "Customer",
            Timestamp = DateTime.UtcNow
        };
        
        session.LastUpdatedAt = DateTime.UtcNow;
        _dbContext.ChatMessages.Add(message);
        await _dbContext.SaveChangesAsync();

        // Broadcast to CS Agents
        await Clients.Group("cs_agents").SendAsync("ReceiveSupportMessage", sessionId, message.Id, "Customer", messageText, message.Timestamp);
        
        // Also echo to the session group so other tabs of the user see it
        await Clients.Group(sessionId).SendAsync("ReceiveSupportMessage", sessionId, message.Id, "Customer", messageText, message.Timestamp);

        // --- AI SassyBot Integration ---
        // Show typing indicator
        await SendTypingIndicator(sessionId, true);
        
        try
        {
            var history = await _dbContext.ChatMessages
                .Where(m => m.ChatSessionId == sessionId)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            var aiReply = await _aiSupportService.GetReplyAsync("Web", sessionId, messageText, history);
            
            // Save AI Reply
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

            // Send back to client
            await Clients.Group(sessionId).SendAsync("ReceiveSupportMessage", sessionId, aiMessage.Id, "Admin", aiReply, aiMessage.Timestamp);
            await Clients.Group("cs_agents").SendAsync("ReceiveSupportMessage", sessionId, aiMessage.Id, "Admin", aiReply, aiMessage.Timestamp);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get AI reply");
        }
        finally
        {
            await SendTypingIndicator(sessionId, false);
        }
    }

    public async Task ReplyToCustomer(string sessionId, string messageText)
    {
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role is "SUPERADMIN" or "CS")
        {
            var session = await _dbContext.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
            if (session != null)
            {
                var message = new ChatMessage
                {
                    ChatSessionId = sessionId,
                    MessageText = messageText,
                    SenderRole = "Admin",
                    Timestamp = DateTime.UtcNow
                };
                session.LastUpdatedAt = DateTime.UtcNow;
                _dbContext.ChatMessages.Add(message);
                await _dbContext.SaveChangesAsync();

                // Send to customer session group
                await Clients.Group(sessionId).SendAsync("ReceiveSupportMessage", sessionId, message.Id, "Admin", messageText, message.Timestamp);
                
                // Also broadcast to other CS agents so they see the reply
                await Clients.Group("cs_agents").SendAsync("ReceiveSupportMessage", sessionId, message.Id, "Admin", messageText, message.Timestamp);

                // Omni-Channel Routing
                if (sessionId.StartsWith("WA-"))
                {
                    var waNumber = sessionId.Substring(3);
                    await _whatsappService.SendMessageAsync(waNumber, messageText);
                }
                else if (sessionId.StartsWith("TG-"))
                {
                    var chatId = sessionId.Substring(3);
                    var botToken = _config["Telegram:BotToken"];
                    if (!string.IsNullOrEmpty(botToken))
                    {
                        var client = _httpClientFactory.CreateClient();
                        var url = $"https://api.telegram.org/bot{botToken}/sendMessage";
                        var payload = new { chat_id = chatId, text = messageText };
                        var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
                        await client.PostAsync(url, content);
                    }
                }
            }
        }
    }

    public async Task SendTypingIndicator(string sessionId, bool isTyping)
    {
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (role is "SUPERADMIN" or "CS")
        {
            await Clients.Group(sessionId).SendAsync("TypingIndicator", sessionId, "Admin", isTyping);
        }
        else
        {
            await Clients.Group("cs_agents").SendAsync("TypingIndicator", sessionId, "Customer", isTyping);
        }
    }
}

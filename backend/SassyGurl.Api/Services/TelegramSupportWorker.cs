using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Hubs;
using SassyGurl.Domain.Entities;

namespace SassyGurl.Api.Services;

public class TelegramSupportWorker : BackgroundService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<SupportHub> _hubContext;
    private readonly ILogger<TelegramSupportWorker> _logger;
    private long _lastUpdateId = 0;

    public TelegramSupportWorker(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        IServiceScopeFactory scopeFactory,
        IHubContext<SupportHub> hubContext,
        ILogger<TelegramSupportWorker> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var botToken = _config["Telegram:BotToken"];
        if (string.IsNullOrEmpty(botToken))
        {
            _logger.LogWarning("Telegram BotToken not configured. TelegramSupportWorker will not run.");
            return;
        }

        _logger.LogInformation("TelegramSupportWorker started polling for Live Chat replies.");

        using var client = _httpClientFactory.CreateClient();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var url = $"https://api.telegram.org/bot{botToken}/getUpdates?offset={_lastUpdateId + 1}&timeout=30";
                var response = await client.GetAsync(url, stoppingToken);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync(stoppingToken);
                    using var doc = JsonDocument.Parse(content);
                    
                    var root = doc.RootElement;
                    if (root.GetProperty("ok").GetBoolean() && root.TryGetProperty("result", out var results))
                    {
                        foreach (var update in results.EnumerateArray())
                        {
                            _lastUpdateId = update.GetProperty("update_id").GetInt64();

                            if (update.TryGetProperty("message", out var message))
                            {
                                await ProcessMessageAsync(message, botToken);
                            }
                        }
                    }
                }
            }
            catch (TaskCanceledException)
            {
                // Normal during shutdown or long-polling timeout
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while polling Telegram updates.");
                await Task.Delay(5000, stoppingToken); // Backoff on error
            }
        }
    }

    private async Task ProcessMessageAsync(JsonElement message, string botToken)
    {
        if (!message.TryGetProperty("text", out var textElement))
            return;

        var messageText = textElement.GetString();
        if (string.IsNullOrEmpty(messageText)) return;

        var chat = message.GetProperty("chat");
        var chatId = chat.GetProperty("id").GetInt64().ToString();
        var fromName = message.GetProperty("from").TryGetProperty("first_name", out var fn) ? fn.GetString() : "Telegram User";

        // Skip messages from the bot itself
        if (message.GetProperty("from").GetProperty("is_bot").GetBoolean())
            return;

        _logger.LogInformation("Received Telegram from {Name} ({ChatId}): {Message}", fromName, chatId, messageText);

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SassyGurlDbContext>();
        var aiSupportService = scope.ServiceProvider.GetRequiredService<IAiSupportService>();

        var sessionId = $"TG-{chatId}";

        // 1. Get or create session
        var session = await dbContext.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session == null)
        {
            session = new ChatSession
            {
                Id = sessionId,
                GuestName = fromName ?? "Telegram User",
                Channel = "Telegram"
            };
            dbContext.ChatSessions.Add(session);
        }

        // 2. Add customer message
        var userMsg = new ChatMessage
        {
            ChatSessionId = sessionId,
            MessageText = messageText,
            SenderRole = "Customer",
            Timestamp = DateTime.UtcNow
        };
        session.LastUpdatedAt = DateTime.UtcNow;
        dbContext.ChatMessages.Add(userMsg);
        await dbContext.SaveChangesAsync();

        // Broadcast to Command Center
        await _hubContext.Clients.Group("cs_agents").SendAsync("ReceiveSupportMessage", sessionId, userMsg.Id, "Customer", userMsg.MessageText, userMsg.Timestamp);

        // 3. Get AI Reply
        try
        {
            var history = await dbContext.ChatMessages
                .Where(m => m.ChatSessionId == sessionId)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            var aiReply = await aiSupportService.GetReplyAsync("Telegram", sessionId, messageText, history);

            // Save AI message to DB
            var aiMessage = new ChatMessage
            {
                ChatSessionId = sessionId,
                MessageText = aiReply,
                SenderRole = "Admin",
                Timestamp = DateTime.UtcNow
            };
            session.LastUpdatedAt = DateTime.UtcNow;
            dbContext.ChatMessages.Add(aiMessage);
            await dbContext.SaveChangesAsync();

            // Broadcast AI reply to Command Center
            await _hubContext.Clients.Group("cs_agents").SendAsync("ReceiveSupportMessage", sessionId, aiMessage.Id, "Admin", aiReply, aiMessage.Timestamp);

            // Send back to Telegram
            await SendTelegramReply(botToken, chatId, aiReply);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process Telegram AI Reply");
        }
    }

    private async Task SendTelegramReply(string botToken, string chatId, string text)
    {
        using var client = _httpClientFactory.CreateClient();
        var url = $"https://api.telegram.org/bot{botToken}/sendMessage";
        var payload = new
        {
            chat_id = chatId,
            text = text
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        await client.PostAsync(url, content);
    }
}

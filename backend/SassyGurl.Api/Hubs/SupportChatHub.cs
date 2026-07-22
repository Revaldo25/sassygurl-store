using Microsoft.AspNetCore.SignalR;
using SassyGurl.Api.Services;

namespace SassyGurl.Api.Hubs;

public class SupportChatHub : Hub
{
    private readonly ITelegramService _telegramService;

    public SupportChatHub(ITelegramService telegramService)
    {
        _telegramService = telegramService;
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Called by the web client to send a message to the Admin.
    /// </summary>
    public async Task SendMessageToAdmin(string message)
    {
        var connectionId = Context.ConnectionId;
        var formattedMessage = $"""
        💬 *Support Chat*
        [User:{connectionId}]
        
        {message}
        """;

        // Forward to Telegram
        await _telegramService.SendMessageAsync(formattedMessage);
    }
}

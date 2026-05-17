using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SassyGurl.Api.Hubs;

/// <summary>
/// Real-Time Notification Hub for SassyGurl Dashboard.
/// Broadcasts transaction status changes to connected clients based on their role.
/// 
/// Client Methods:
///   - "TransactionUpdated"   → Sent to Admin/Owner groups when any transaction changes
///   - "MyOrderUpdated"       → Sent to specific user when their order status changes
///   - "ProviderStatusChanged"→ Sent to Admin/Owner when provider health changes
/// </summary>
[AllowAnonymous]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "MEMBER";

        // Auto-join role-based groups for targeted broadcasting
        if (Context.User?.Identity?.IsAuthenticated == true)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"role:{role}");

            if (role is "SUPERADMIN" or "FINANCE" or "CS")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
            }

            if (role == "SUPERADMIN")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "owners");
            }
            _logger.LogInformation("Dashboard client connected: {UserId} ({Role})", userId, role);
        }
        else
        {
            // Anonymous users join the public feed
            await Groups.AddToGroupAsync(Context.ConnectionId, "PublicFeed");
            _logger.LogInformation("Public client connected to Live Feed: {ConnectionId}", Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Dashboard client disconnected: {UserId}", Context.UserIdentifier);
        await base.OnDisconnectedAsync(exception);
    }
}

/// <summary>
/// Static helper for broadcasting from non-Hub services (e.g., PaymentService).
/// Inject IHubContext<NotificationHub> and call these methods.
/// </summary>
public static class NotificationBroadcaster
{
    /// <summary>
    /// Notify all admin/owner dashboards that a transaction status changed.
    /// </summary>
    public static async Task BroadcastTransactionUpdate(
        IHubContext<NotificationHub> hub,
        TransactionUpdatePayload payload)
    {
        await hub.Clients.Group("admins").SendAsync("TransactionUpdated", payload);
    }

    /// <summary>
    /// Notify a specific member that their order status changed.
    /// </summary>
    public static async Task NotifyUserOrderUpdate(
        IHubContext<NotificationHub> hub,
        string userId,
        TransactionUpdatePayload payload)
    {
        await hub.Clients.User(userId).SendAsync("MyOrderUpdated", payload);
    }

    /// <summary>
    /// Notify admins/owners about provider status changes.
    /// </summary>
    public static async Task BroadcastProviderStatus(
        IHubContext<NotificationHub> hub,
        ProviderStatusPayload payload)
    {
        await hub.Clients.Group("admins").SendAsync("ProviderStatusChanged", payload);
    }

    /// <summary>
    /// Notify public feed about successful transaction (privacy masked).
    /// </summary>
    public static async Task BroadcastPublicTransaction(
        IHubContext<NotificationHub> hub,
        PublicTransactionPayload payload)
    {
        await hub.Clients.Group("PublicFeed").SendAsync("PublicTransactionUpdated", payload);
    }
}

// ── SignalR Payload DTOs ─────────────────────────────────────────────────────

public record PublicTransactionPayload(
    string MaskedTarget,
    string GameName,
    string ProductName,
    DateTime Timestamp
);

public record TransactionUpdatePayload(
    string TransactionId,
    string InvoiceId,
    string GameName,
    string ProductName,
    string TargetId,
    decimal Amount,
    string PaymentStatus,
    string OrderStatus,
    string? ProviderRef,
    DateTime UpdatedAt
);

public record ProviderStatusPayload(
    string ProviderName,
    bool IsActive,
    decimal SuccessRate,
    int AvgLatencyMs,
    DateTime CheckedAt
);

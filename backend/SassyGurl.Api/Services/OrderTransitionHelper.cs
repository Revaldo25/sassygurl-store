using SassyGurl.Api.Data;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;

namespace SassyGurl.Api.Services;

/// <summary>
/// Central helper for order status transitions. Enforces state machine rules
/// and writes OrderStatusHistory in a single atomic call.
/// 
/// All code that changes OrderStatus MUST go through this helper.
/// Master Plan §8: "satu order hanya boleh punya satu jalur status yang valid"
/// </summary>
public interface IOrderTransitionHelper
{
    /// <summary>
    /// Validates the transition, updates the order status, and writes an OrderStatusHistory record.
    /// Throws InvalidOperationException if the transition is illegal.
    /// Does NOT call SaveChangesAsync — caller is responsible for that.
    /// </summary>
    void TransitionStatus(
        Transaction transaction,
        OrderStatus newStatus,
        string changedBy,
        string? reason = null,
        string? metadata = null);

    /// <summary>
    /// Same as TransitionStatus but with the DbContext to add the history record.
    /// </summary>
    void TransitionStatus(
        SassyGurlDbContext db,
        Transaction transaction,
        OrderStatus newStatus,
        string changedBy,
        string? reason = null,
        string? metadata = null);
}

public class OrderTransitionHelper : IOrderTransitionHelper
{
    private readonly IOrderStateMachine _stateMachine;
    private readonly SassyGurlDbContext _db;
    private readonly ILogger<OrderTransitionHelper> _logger;

    public OrderTransitionHelper(
        IOrderStateMachine stateMachine,
        SassyGurlDbContext db,
        ILogger<OrderTransitionHelper> logger)
    {
        _stateMachine = stateMachine;
        _db = db;
        _logger = logger;
    }

    public void TransitionStatus(
        Transaction transaction,
        OrderStatus newStatus,
        string changedBy,
        string? reason = null,
        string? metadata = null)
    {
        TransitionStatus(_db, transaction, newStatus, changedBy, reason, metadata);
    }

    public void TransitionStatus(
        SassyGurlDbContext db,
        Transaction transaction,
        OrderStatus newStatus,
        string changedBy,
        string? reason = null,
        string? metadata = null)
    {
        var oldStatus = transaction.OrderStatus;

        // Validate the transition
        _stateMachine.ValidateTransition(oldStatus, newStatus);

        // Apply the transition
        transaction.OrderStatus = newStatus;

        // Write audit trail
        var history = new OrderStatusHistory
        {
            TransactionId = transaction.Id,
            FromStatus = oldStatus,
            ToStatus = newStatus,
            ChangedBy = changedBy,
            Reason = reason,
            Metadata = metadata
        };
        db.OrderStatusHistories.Add(history);

        _logger.LogInformation(
            "Order {InvoiceId} transitioned: {From} → {To} by {ChangedBy}. Reason: {Reason}",
            transaction.InvoiceId, oldStatus, newStatus, changedBy, reason ?? "(none)");
    }
}

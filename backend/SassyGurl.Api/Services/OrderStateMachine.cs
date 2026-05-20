using SassyGurl.Api.Models.Enums;

namespace SassyGurl.Api.Services;

/// <summary>
/// Enforces valid order status transitions as defined in Master Plan §8.
/// Prevents invalid state changes (e.g., SUCCESS → PENDING).
/// All status changes in the system MUST go through this service.
/// </summary>
public interface IOrderStateMachine
{
    /// <summary>
    /// Checks if a transition from one status to another is valid.
    /// </summary>
    bool IsValidTransition(OrderStatus from, OrderStatus to);

    /// <summary>
    /// Returns all valid next states from the given status.
    /// </summary>
    IReadOnlyList<OrderStatus> GetValidNextStates(OrderStatus current);

    /// <summary>
    /// Validates a transition and throws InvalidOperationException if invalid.
    /// </summary>
    void ValidateTransition(OrderStatus from, OrderStatus to);
}

public class OrderStateMachine : IOrderStateMachine
{
    /// <summary>
    /// State transition map aligned with Master Plan §8.
    /// Key = current status, Value = list of valid next statuses.
    /// </summary>
    private static readonly Dictionary<OrderStatus, OrderStatus[]> _transitions = new()
    {
        [OrderStatus.DRAFT] = [OrderStatus.PENDING],

        [OrderStatus.PENDING] = [
            OrderStatus.PROCESSING,   // Payment received, moving to processing
            OrderStatus.CANCELLED,    // User cancelled or payment expired
            OrderStatus.FAILED        // Payment denied
        ],

        [OrderStatus.PROCESSING] = [
            OrderStatus.SUCCESS,      // Provider fulfilled successfully
            OrderStatus.FAILED,       // Provider failed
            OrderStatus.PARTIAL       // Partial fulfillment (rare)
        ],

        [OrderStatus.SUCCESS] = [],   // Terminal state — no further transitions

        [OrderStatus.FAILED] = [
            OrderStatus.REFUNDING,    // Initiating refund for paid-but-failed
            OrderStatus.PROCESSING    // Retry — attempt again with fallback provider
        ],

        [OrderStatus.PARTIAL] = [
            OrderStatus.PROCESSING,   // Retry remaining
            OrderStatus.REFUNDING,    // Refund partial amount
            OrderStatus.FAILED        // Give up
        ],

        [OrderStatus.REFUNDING] = [
            OrderStatus.REFUNDED      // Refund completed
        ],

        [OrderStatus.REFUNDED] = [],  // Terminal state

        [OrderStatus.CANCELLED] = []  // Terminal state
    };

    public bool IsValidTransition(OrderStatus from, OrderStatus to)
    {
        if (_transitions.TryGetValue(from, out var validNextStates))
        {
            return validNextStates.Contains(to);
        }
        return false;
    }

    public IReadOnlyList<OrderStatus> GetValidNextStates(OrderStatus current)
    {
        if (_transitions.TryGetValue(current, out var validNextStates))
        {
            return validNextStates;
        }
        return Array.Empty<OrderStatus>();
    }

    public void ValidateTransition(OrderStatus from, OrderStatus to)
    {
        if (!IsValidTransition(from, to))
        {
            var validStates = GetValidNextStates(from);
            var validStr = validStates.Any()
                ? string.Join(", ", validStates)
                : "(none — terminal state)";

            throw new InvalidOperationException(
                $"Invalid order status transition: {from} → {to}. " +
                $"Valid transitions from {from}: {validStr}");
        }
    }
}

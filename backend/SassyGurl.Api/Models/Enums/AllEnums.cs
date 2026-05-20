namespace SassyGurl.Api.Models.Enums;

public enum Role
{
    MEMBER,
    RESELLER,
    VIP,
    CS,
    FINANCE,
    SUPERADMIN
}

public enum KycStatus
{
    UNVERIFIED,
    PENDING,
    VERIFIED,
    REJECTED,
    BANNED
}

public enum PaymentStatus
{
    UNPAID,
    PENDING,
    PAID,
    EXPIRED,
    FAILED,
    REFUNDED,
    CHARGEBACK
}

/// <summary>
/// Order status state machine aligned with Master Plan §8.
/// Valid transitions:
///   Draft → PendingPayment
///   PendingPayment → Paid | Cancelled | Expired
///   Paid → Processing
///   Processing → Success | Failed
///   Failed → Refunded | Processing (retry)
///   Success → (terminal)
///   Refunded → (terminal)
///   Cancelled → (terminal)
/// </summary>
public enum OrderStatus
{
    DRAFT,
    PENDING,          // Legacy: maps to PendingPayment
    PROCESSING,
    SUCCESS,
    FAILED,           // Replaces ERROR — provider/system failure
    PARTIAL,          // Kept for backward compat — partial fulfillment
    REFUNDING,        // Refund in progress
    REFUNDED,         // Refund completed (terminal)
    CANCELLED         // User/system cancelled before payment (terminal)
}

public enum TicketStatus
{
    OPEN,
    IN_PROGRESS,
    WAITING_USER,
    RESOLVED,
    CLOSED
}

public enum TicketPriority
{
    LOW,
    MEDIUM,
    HIGH,
    URGENT
}

public enum MutationType
{
    DEPOSIT,
    PAYMENT,
    REFUND,
    COMMISSION,
    WITHDRAWAL,
    ADJUSTMENT
}

public enum PromoType
{
    FLAT,
    PERCENTAGE
}

public enum PaymentType
{
    EWALLET,
    QRIS,
    VIRTUAL_ACCOUNT,
    RETAIL
}

public enum ProviderSource
{
    VIP,
    DIGIFLAZZ
}

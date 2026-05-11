namespace SassyGurl.Domain.Enums;

/// <summary>
/// Represents the lifecycle states of a transaction for the audit trail system.
/// Each transition is automatically recorded by the SaveChangesInterceptor.
/// </summary>
public enum TransactionStatus
{
    Created = 0,
    PaymentPending = 1,
    PaymentReceived = 2,
    Processing = 3,
    Fulfilled = 4,
    Completed = 5,
    Failed = 6,
    Refunding = 7,
    Refunded = 8,
    Cancelled = 9,
    Expired = 10
}

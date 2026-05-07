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

public enum OrderStatus
{
    PENDING,
    PROCESSING,
    SUCCESS,
    ERROR,
    PARTIAL,
    REFUNDING
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

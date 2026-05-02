using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SassyGurl.Api.Models.Enums;

namespace SassyGurl.Api.Models;

// ============================================================================
// 1. USER & ACCOUNTS
// ============================================================================

public class User
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string? Name { get; set; }

    public string? Email { get; set; }

    public DateTime? EmailVerified { get; set; }

    public string? Image { get; set; }

    public string? Password { get; set; }

    public string? Phone { get; set; }

    public Role Role { get; set; } = Role.MEMBER;

    public KycStatus KycStatus { get; set; } = KycStatus.UNVERIFIED;

    public bool IsVerified { get; set; } = false;

    public string? IdCardNumber { get; set; }

    public string? IdCardImage { get; set; }

    public string? TaxNumber { get; set; }

    public bool IsTwoFactorEnable { get; set; } = false;

    public string? LastLoginIp { get; set; }

    public string? DeviceId { get; set; }

    [Column(TypeName = "decimal(15,2)")]
    public decimal Balance { get; set; } = 0;

    public int Points { get; set; } = 0;

    public string ReferralCode { get; set; } = Guid.NewGuid().ToString();

    public string? ReferrerId { get; set; }

    [ForeignKey(nameof(ReferrerId))]
    public User? Referrer { get; set; }

    public ICollection<User> Referees { get; set; } = [];

    [Column(TypeName = "decimal(15,2)")]
    public decimal TotalCommission { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public ICollection<Transaction> Transactions { get; set; } = [];
    public ICollection<WalletLedger> WalletLedgers { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
    public ICollection<SupportTicket> SupportTickets { get; set; } = [];
    public ICollection<SystemAudit> AuditLogs { get; set; } = [];
    public ICollection<Account> Accounts { get; set; } = [];
}

public class Account
{
    [Key]
    public string Id { get; set; } = null!;

    public string UserId { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string Provider { get; set; } = null!;
    public string ProviderAccountId { get; set; } = null!;

    [Column(TypeName = "text")]
    public string? RefreshToken { get; set; }

    [Column(TypeName = "text")]
    public string? AccessToken { get; set; }

    public int? ExpiresAt { get; set; }

    public string? TokenType { get; set; }
    public string? Scope { get; set; }

    [Column(TypeName = "text")]
    public string? IdToken { get; set; }

    public string? SessionState { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}

// ============================================================================
// 2. WALLET LEDGER
// ============================================================================

public class WalletLedger
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string UserId { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public string? TransactionId { get; set; }

    public MutationType Type { get; set; }

    [Column(TypeName = "decimal(15,2)")]
    public decimal Debit { get; set; } = 0;

    [Column(TypeName = "decimal(15,2)")]
    public decimal Credit { get; set; } = 0;

    [Column(TypeName = "decimal(15,2)")]
    public decimal BalanceSnapshot { get; set; }

    public string Description { get; set; } = null!;

    public string? PerformedById { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ============================================================================
// 3. CATALOG — Category, Game, Review
// ============================================================================

public class Category
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public int SortOrder { get; set; } = 0;

    public ICollection<Game> Games { get; set; } = [];
}

public class Game
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string CategoryId { get; set; } = null!;

    [ForeignKey(nameof(CategoryId))]
    public Category Category { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public string? Publisher { get; set; }

    public string? Thumbnail { get; set; }

    public string? Banner { get; set; }

    public string? GuideImage { get; set; }

    public bool HasServerId { get; set; } = false;

    [Column(TypeName = "jsonb")]
    public string? ServerOptions { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsHot { get; set; } = false;

    public int SortOrder { get; set; } = 0;

    // Navigation Properties
    public ICollection<Product> Products { get; set; } = [];
    public ICollection<Transaction> Transactions { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
}

public class Review
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string UserId { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public string GameId { get; set; } = null!;

    [ForeignKey(nameof(GameId))]
    public Game Game { get; set; } = null!;

    public string TransactionId { get; set; } = null!;

    public int Rating { get; set; }

    [Column(TypeName = "text")]
    public string? Comment { get; set; }

    [Column(TypeName = "jsonb")]
    public string? Images { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ============================================================================
// 4. PRODUCT & PROVIDER
// ============================================================================

public class Provider
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string Name { get; set; } = null!;

    [Column(TypeName = "decimal(15,2)")]
    public decimal Balance { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    [Column(TypeName = "decimal(5,2)")]
    public decimal SuccessRate { get; set; } = 100;

    public int AvgLatencyMs { get; set; } = 0;

    public ICollection<Product> Products { get; set; } = [];
}

public class Product
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string GameId { get; set; } = null!;

    [ForeignKey(nameof(GameId))]
    public Game Game { get; set; } = null!;

    public string ProviderId { get; set; } = null!;

    [ForeignKey(nameof(ProviderId))]
    public Provider Provider { get; set; } = null!;

    public string Sku { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal PriceModal { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal PriceSell { get; set; } = 0;

    [Column(TypeName = "decimal(10,2)")]
    public decimal PriceMember { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal PriceReseller { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal PriceVip { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? OriginalPrice { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsFlashSale { get; set; } = false;

    public int Stock { get; set; } = 99999;

    public ICollection<Transaction> Transactions { get; set; } = [];
}

// ============================================================================
// 5. PAYMENT & PROMO
// ============================================================================

public class PaymentMethod
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public PaymentType Type { get; set; }

    public string? Logo { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal FeeFlat { get; set; } = 0;

    [Column(TypeName = "decimal(5,2)")]
    public decimal FeePercent { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; } = 0;

    public ICollection<Transaction> Transactions { get; set; } = [];
}

public class Promo
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string Code { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public PromoType Type { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Value { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? MaxDiscount { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal MinTransaction { get; set; } = 0;

    public int Quota { get; set; } = 100;

    public int UsedCount { get; set; } = 0;

    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Transaction> Transactions { get; set; } = [];
}

// ============================================================================
// 6. TRANSACTION
// ============================================================================

public class Transaction
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string InvoiceId { get; set; } = null!;

    public string? UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    public string GameId { get; set; } = null!;

    [ForeignKey(nameof(GameId))]
    public Game Game { get; set; } = null!;

    public string ProductId { get; set; } = null!;

    [ForeignKey(nameof(ProductId))]
    public Product Product { get; set; } = null!;

    public string Sku { get; set; } = null!;

    public string DenomName { get; set; } = null!;

    public string TargetId { get; set; } = null!;

    public string? ZoneId { get; set; }

    public string? TargetName { get; set; }

    public string? Email { get; set; }

    public string? Whatsapp { get; set; }

    public string PaymentId { get; set; } = null!;

    [ForeignKey(nameof(PaymentId))]
    public PaymentMethod Payment { get; set; } = null!;

    public string? PromoId { get; set; }

    [ForeignKey(nameof(PromoId))]
    public Promo? Promo { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal PriceModal { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal PriceSell { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal AdminFee { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal TaxVat { get; set; } = 0;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Discount { get; set; } = 0;

    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Profit { get; set; }

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.UNPAID;

    public OrderStatus OrderStatus { get; set; } = OrderStatus.PENDING;

    public string? PaymentRef { get; set; }

    public string? ProviderRef { get; set; }

    public string? Sn { get; set; }

    [Column(TypeName = "jsonb")]
    public string? WebhookData { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiredAt { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}

public class RefundQueue
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string TransactionId { get; set; } = null!;

    [ForeignKey(nameof(TransactionId))]
    public Transaction Transaction { get; set; } = null!;

    public string Reason { get; set; } = null!;

    public bool IsProcessed { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ProcessedAt { get; set; }
}

// ============================================================================
// 7. SUPPORT
// ============================================================================

public class SupportTicket
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string TicketNumber { get; set; } = null!;

    public string UserId { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public string Subject { get; set; } = null!;

    public string? TransactionId { get; set; }

    public TicketStatus Status { get; set; } = TicketStatus.OPEN;

    public TicketPriority Priority { get; set; } = TicketPriority.MEDIUM;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TicketMessage> Messages { get; set; } = [];
}

public class TicketMessage
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string TicketId { get; set; } = null!;

    [ForeignKey(nameof(TicketId))]
    public SupportTicket Ticket { get; set; } = null!;

    public string SenderId { get; set; } = null!;

    [Column(TypeName = "text")]
    public string Message { get; set; } = null!;

    [Column(TypeName = "jsonb")]
    public string? Attachments { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ============================================================================
// 8. AUDIT TRAIL
// ============================================================================

public class SystemAudit
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string ActionBy { get; set; } = null!;

    [ForeignKey(nameof(ActionBy))]
    public User Admin { get; set; } = null!;

    public string Action { get; set; } = null!;

    public string Entity { get; set; } = null!;

    public string EntityId { get; set; } = null!;

    [Column(TypeName = "jsonb")]
    public string? OldValues { get; set; }

    [Column(TypeName = "jsonb")]
    public string? NewValues { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ============================================================================
// 9. VERIFICATION TOKEN
// ============================================================================

public class VerificationToken
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string Identifier { get; set; } = null!;

    public string Token { get; set; } = null!;

    public DateTime Expires { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ============================================================================
// 10. SYSTEM SETTINGS (Smart Markup, Fees, Store Config)
// ============================================================================

public class SystemSetting
{
    [Key]
    [MaxLength(100)]
    public string Key { get; set; } = null!;

    public string Value { get; set; } = null!;

    [MaxLength(255)]
    public string? Description { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string? UpdatedBy { get; set; }
}

// ============================================================================
// 11. DAILY PROFITS (Financial Reconciliation)
// ============================================================================

public class DailyProfit
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public DateTime Date { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalRevenue { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalProviderCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal NetProfit { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAdminFee { get; set; }

    public int OrderCount { get; set; }

    public int SuccessCount { get; set; }

    public int FailedCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

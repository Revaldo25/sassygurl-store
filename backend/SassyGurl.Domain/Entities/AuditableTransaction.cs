using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SassyGurl.Domain.Enums;

namespace SassyGurl.Domain.Entities;

/// <summary>
/// Auditable transaction entity with automatic JSONB audit trail.
/// The AuditLog column stores a chronological array of status changes,
/// populated automatically by the TransactionAuditInterceptor (EF Core SaveChangesInterceptor).
/// 
/// Schema: Transactions table in PostgreSQL
///   - Id: UUID primary key
///   - OrderNumber: unique human-readable identifier (e.g., "SG-20260504-0001")
///   - Status: current TransactionStatus enum value
///   - Amount: monetary value in IDR (decimal 18,2)
///   - AuditLog: JSONB array of AuditLogEntry objects
/// </summary>
public class AuditableTransaction
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Human-readable order number. Format: SG-{yyyyMMdd}-{sequence}
    /// Indexed for fast lookup.
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string OrderNumber { get; set; } = null!;

    /// <summary>
    /// Current status in the transaction lifecycle.
    /// Every change to this field is automatically captured in AuditLog.
    /// </summary>
    public TransactionStatus Status { get; set; } = TransactionStatus.Created;

    /// <summary>
    /// Transaction amount in IDR.
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    /// <summary>
    /// JSONB column storing chronological audit entries.
    /// Automatically populated by TransactionAuditInterceptor.
    /// Never write to this manually — the interceptor handles all mutations.
    /// 
    /// Structure: [{ "timestamp": "...", "fromStatus": "...", "toStatus": "...", "metadata": {...} }, ...]
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string AuditLog { get; set; } = "[]";

    /// <summary>
    /// Optional reference to the original Transaction entity for linking.
    /// </summary>
    public string? OriginalTransactionId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

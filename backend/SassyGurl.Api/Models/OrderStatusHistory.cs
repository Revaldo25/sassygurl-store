using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SassyGurl.Api.Models.Enums;

namespace SassyGurl.Api.Models;

/// <summary>
/// Tracks every status transition for audit trail compliance (Master Plan §8).
/// Every change to Transaction.OrderStatus MUST create a corresponding record here.
/// </summary>
public class OrderStatusHistory
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string TransactionId { get; set; } = null!;

    [ForeignKey(nameof(TransactionId))]
    public Transaction Transaction { get; set; } = null!;

    public OrderStatus FromStatus { get; set; }

    public OrderStatus ToStatus { get; set; }

    /// <summary>
    /// Who triggered the transition: "system", "webhook:midtrans", "webhook:xendit", 
    /// "admin:{userId}", "provider:{providerName}", etc.
    /// </summary>
    [MaxLength(200)]
    public string ChangedBy { get; set; } = "system";

    /// <summary>
    /// Human-readable reason for the transition.
    /// Examples: "Payment received via Midtrans", "Provider Digiflazz returned error", 
    /// "Admin manual override", "Payment expired after 24h"
    /// </summary>
    [Column(TypeName = "text")]
    public string? Reason { get; set; }

    /// <summary>
    /// Optional JSONB metadata for additional context (webhook payload, provider response, etc.)
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? Metadata { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

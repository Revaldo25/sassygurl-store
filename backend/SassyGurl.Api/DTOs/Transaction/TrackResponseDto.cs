namespace SassyGurl.Api.DTOs.Transaction;

public class TrackResponseDto
{
    public string InvoiceId { get; set; } = null!;
    public string GameName { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string TargetId { get; set; } = null!;
    public string? ZoneId { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public string PaymentStatus { get; set; } = null!;
    public string OrderStatus { get; set; } = null!;
    public string? Sn { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

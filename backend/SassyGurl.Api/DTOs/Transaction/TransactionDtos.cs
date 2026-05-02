using System.ComponentModel.DataAnnotations;

namespace SassyGurl.Api.DTOs.Transaction;

public class CreateTransactionDto
{
    [Required]
    public string ProductId { get; set; } = null!;

    [Required]
    public string TargetId { get; set; } = null!;

    public string? ZoneId { get; set; }
    
    public string? Server { get; set; }

    [Required]
    public int Quantity { get; set; } = 1;

    [Required]
    public string PaymentMethod { get; set; } = null!;

    public string? Email { get; set; }
    
    public string? Whatsapp { get; set; }
    
    public bool WaNotif { get; set; } = false;
}

public class TransactionResponseDto
{
    public string InvoiceId { get; set; } = null!;
    public string PaymentToken { get; set; } = null!;
}

public class UpdateTransactionStatusDto
{
    [Required]
    public string Status { get; set; } = null!; // "PROCESSING", "SUCCESS", "ERROR"
}

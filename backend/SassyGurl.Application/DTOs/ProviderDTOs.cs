namespace SassyGurl.Application.DTOs;

public class ProviderProductDto
{
    public string Sku { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string Brand { get; set; } = null!;
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
    public string ProviderName { get; set; } = null!;
}

public class ProviderOrderResponseDto
{
    public bool IsSuccess { get; set; }
    public string Status { get; set; } = null!; // e.g., Pending, Success, Failed
    public string? Sn { get; set; }
    public string? Note { get; set; }
    public string ProviderOrderId { get; set; } = null!;
}

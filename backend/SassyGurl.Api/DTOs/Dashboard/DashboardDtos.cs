namespace SassyGurl.Api.DTOs.Dashboard;

public class MemberStatsDto
{
    public decimal TotalSpent { get; set; }
    public int TotalOrders { get; set; }
    public int SuccessOrders { get; set; }
    public int PendingOrders { get; set; }
    public decimal Balance { get; set; }
    public int Points { get; set; }
    public string LoyaltyLevel { get; set; } = null!;
}

public class AdminStatsDto
{
    public decimal TotalOmzet { get; set; }
    public decimal TotalProfit { get; set; }
    public int TotalTransactions { get; set; }
    public int SuccessTransactions { get; set; }
    public int PendingTransactions { get; set; }
    public int FailedTransactions { get; set; }
    public int TotalUsers { get; set; }
    public int TotalGames { get; set; }
    public int TotalProducts { get; set; }
}

public class RecentTransactionDto
{
    public string Id { get; set; } = null!;
    public string InvoiceId { get; set; } = null!;
    public string GameName { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string TargetId { get; set; } = null!;
    public decimal Amount { get; set; }
    public decimal Profit { get; set; }
    public string PaymentStatus { get; set; } = null!;
    public string OrderStatus { get; set; } = null!;
    public string? ProviderRef { get; set; }
    public DateTime CreatedAt { get; set; }
}

using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.DTOs.Dashboard;
using SassyGurl.Api.Models.Enums;

namespace SassyGurl.Api.Services;

public interface IDashboardService
{
    Task<ApiResponse<MemberStatsDto>> GetMemberStatsAsync(string userId);
    Task<ApiResponse<PaginatedResponse<RecentTransactionDto>>> GetMemberTransactionsAsync(string userId, string filter, string search);
    Task<ApiResponse<AdminStatsDto>> GetAdminStatsAsync();
    Task<ApiResponse<PaginatedResponse<RecentTransactionDto>>> GetAdminTransactionsAsync(string filter, string search);
    Task<ApiResponse<OwnerStatsDto>> GetOwnerStatsAsync();
}

public class DashboardService : IDashboardService
{
    private readonly SassyGurlDbContext _context;

    public DashboardService(SassyGurlDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<MemberStatsDto>> GetMemberStatsAsync(string userId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return ApiResponse<MemberStatsDto>.Fail("User not found");

        var txBaseQuery = _context.Transactions
            .AsNoTracking()
            .Where(t => t.UserId == userId);

        var totalOrders = await txBaseQuery.CountAsync();
        var successOrders = await txBaseQuery.CountAsync(t => t.PaymentStatus == PaymentStatus.PAID);
        var pendingOrders = await txBaseQuery.CountAsync(t => t.PaymentStatus == PaymentStatus.PENDING);
        var totalSpent = await txBaseQuery
            .Where(t => t.PaymentStatus == PaymentStatus.PAID)
            .SumAsync(t => (decimal?)t.TotalAmount) ?? 0m;

        var stats = new MemberStatsDto
        {
            TotalSpent = totalSpent,
            TotalOrders = totalOrders,
            SuccessOrders = successOrders,
            PendingOrders = pendingOrders,
            Balance = user.Balance,
            Points = user.Points,
            LoyaltyLevel = GetLoyaltyLevel(totalSpent)
        };

        return ApiResponse<MemberStatsDto>.Ok(stats);
    }

    public async Task<ApiResponse<PaginatedResponse<RecentTransactionDto>>> GetMemberTransactionsAsync(string userId, string filter, string search)
    {
        var query = _context.Transactions
            .AsNoTracking()
            .Include(t => t.Game)
            .Include(t => t.Product)
            .Where(t => t.UserId == userId);

        if (!string.IsNullOrEmpty(filter) && filter != "ALL")
        {
            if (Enum.TryParse<PaymentStatus>(filter, true, out var pStatus))
            {
                 query = query.Where(t => t.PaymentStatus == pStatus);
            }
        }

        if (!string.IsNullOrEmpty(search))
        {
            var searchPattern = $"%{search.Trim()}%";
            query = query.Where(t => EF.Functions.ILike(t.InvoiceId, searchPattern) || EF.Functions.ILike(t.Game.Name, searchPattern));
        }

        var dto = await query
            .OrderByDescending(t => t.CreatedAt)
            .Take(20)
            .Select(t => new RecentTransactionDto
            {
                Id = t.Id,
                InvoiceId = t.InvoiceId,
                GameName = t.Game.Name,
                ProductName = t.Product.Name,
                TargetId = t.TargetId,
                Amount = t.TotalAmount,
                Profit = t.Profit,
                PaymentStatus = t.PaymentStatus.ToString(),
                OrderStatus = t.OrderStatus.ToString(),
                ProviderRef = t.ProviderRef,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return ApiResponse<PaginatedResponse<RecentTransactionDto>>.Ok(new PaginatedResponse<RecentTransactionDto>
        {
            Data = dto,
            Total = dto.Count,
            Page = 1,
            PerPage = 20
        });
    }

    public async Task<ApiResponse<AdminStatsDto>> GetAdminStatsAsync()
    {
        var txBaseQuery = _context.Transactions
            .AsNoTracking()
            .AsQueryable();

        var userCount = await _context.Users.CountAsync();
        var gameCount = await _context.Games.CountAsync();
        var productCount = await _context.Products.CountAsync(p => p.IsActive);
        var totalTransactions = await txBaseQuery.CountAsync();
        var successTransactions = await txBaseQuery.CountAsync(t => t.PaymentStatus == PaymentStatus.PAID);
        var pendingTransactions = await txBaseQuery.CountAsync(t => t.PaymentStatus == PaymentStatus.PENDING);
        var failedTransactions = await txBaseQuery.CountAsync(t => t.PaymentStatus == PaymentStatus.FAILED);
        var totalOmzet = await txBaseQuery
            .Where(t => t.PaymentStatus == PaymentStatus.PAID)
            .SumAsync(t => (decimal?)t.TotalAmount) ?? 0m;
        var totalProfit = await txBaseQuery
            .Where(t => t.PaymentStatus == PaymentStatus.PAID)
            .SumAsync(t => (decimal?)t.Profit) ?? 0m;

        var stats = new AdminStatsDto
        {
            TotalOmzet = totalOmzet,
            TotalProfit = totalProfit,
            TotalTransactions = totalTransactions,
            SuccessTransactions = successTransactions,
            PendingTransactions = pendingTransactions,
            FailedTransactions = failedTransactions,
            TotalUsers = userCount,
            TotalGames = gameCount,
            TotalProducts = productCount
        };

        return ApiResponse<AdminStatsDto>.Ok(stats);
    }

    public async Task<ApiResponse<PaginatedResponse<RecentTransactionDto>>> GetAdminTransactionsAsync(string filter, string search)
    {
        var query = _context.Transactions
            .AsNoTracking()
            .Include(t => t.Game)
            .Include(t => t.Product)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter) && filter != "ALL")
        {
            if (filter == "SUCCESS") query = query.Where(t => t.OrderStatus == OrderStatus.SUCCESS);
            else if (filter == "PENDING") query = query.Where(t => t.OrderStatus == OrderStatus.PENDING);
            else if (filter == "FAILED") query = query.Where(t => t.PaymentStatus == PaymentStatus.FAILED);
        }

        if (!string.IsNullOrEmpty(search))
        {
            var searchPattern = $"%{search.Trim()}%";
            query = query.Where(t => EF.Functions.ILike(t.InvoiceId, searchPattern) || 
                                     EF.Functions.ILike(t.Game.Name, searchPattern) || 
                                     EF.Functions.ILike(t.TargetId, searchPattern));
        }

        var dto = await query
            .OrderByDescending(t => t.CreatedAt)
            .Take(50)
            .Select(t => new RecentTransactionDto
            {
                Id = t.Id,
                InvoiceId = t.InvoiceId,
                GameName = t.Game.Name,
                ProductName = t.Product.Name,
                TargetId = t.TargetId,
                Amount = t.TotalAmount,
                Profit = t.Profit,
                PaymentStatus = t.PaymentStatus.ToString(),
                OrderStatus = t.OrderStatus.ToString(),
                ProviderRef = t.ProviderRef,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return ApiResponse<PaginatedResponse<RecentTransactionDto>>.Ok(new PaginatedResponse<RecentTransactionDto>
        {
            Data = dto,
            Total = dto.Count,
            Page = 1,
            PerPage = 50
        });
    }

    public async Task<ApiResponse<OwnerStatsDto>> GetOwnerStatsAsync()
    {
        var paidQuery = _context.Transactions
            .AsNoTracking()
            .Where(t => t.PaymentStatus == PaymentStatus.PAID);

        // Core financial metrics: Revenue = Sum(PriceSell), Cost = Sum(PriceModal)
        var totalRevenue = await paidQuery.SumAsync(t => (decimal?)t.PriceSell) ?? 0m;
        var totalCost = await paidQuery.SumAsync(t => (decimal?)t.PriceModal) ?? 0m;

        // Today's snapshot
        var todayUtc = DateTime.UtcNow.Date;
        var tomorrowUtc = todayUtc.AddDays(1);
        var todayQuery = paidQuery.Where(t => t.PaidAt != null && t.PaidAt.Value >= todayUtc && t.PaidAt.Value < tomorrowUtc);
        var todayRevenue = await todayQuery.SumAsync(t => (decimal?)t.PriceSell) ?? 0m;
        var todayCost = await todayQuery.SumAsync(t => (decimal?)t.PriceModal) ?? 0m;

        // Transaction counters
        var allTxQuery = _context.Transactions.AsNoTracking();
        var totalTx = await allTxQuery.CountAsync();
        var successTx = await allTxQuery.CountAsync(t => t.PaymentStatus == PaymentStatus.PAID);
        var pendingTx = await allTxQuery.CountAsync(t => t.PaymentStatus == PaymentStatus.PENDING);
        var failedTx = await allTxQuery.CountAsync(t => t.PaymentStatus == PaymentStatus.FAILED);

        // Entity counts
        var userCount = await _context.Users.AsNoTracking().CountAsync();
        var gameCount = await _context.Games.AsNoTracking().CountAsync();
        var productCount = await _context.Products.AsNoTracking().CountAsync(p => p.IsActive);
        var refundCount = await _context.RefundQueues.AsNoTracking().CountAsync(r => !r.IsProcessed);

        // Daily revenue for last 7 days (Financial Radar chart data)
        // Step 1: Aggregate on DB side (no ToString — EF can't translate it)
        var sevenDaysAgo = todayUtc.AddDays(-6);
        var dailyRaw = await paidQuery
            .Where(t => t.PaidAt != null && t.PaidAt.Value >= sevenDaysAgo)
            .GroupBy(t => t.PaidAt!.Value.Date)
            .Select(g => new
            {
                DateKey = g.Key,
                Revenue = g.Sum(t => t.PriceSell),
                Profit = g.Sum(t => t.PriceSell - t.PriceModal),
                OrderCount = g.Count()
            })
            .OrderBy(d => d.DateKey)
            .ToListAsync();

        // Step 2: Format dates in C# memory (safe — no LINQ translation needed)
        var dailyData = dailyRaw.Select(d => new DailyRevenueDto
        {
            Date = d.DateKey.ToString("yyyy-MM-dd"),
            Revenue = d.Revenue,
            Profit = d.Profit,
            OrderCount = d.OrderCount
        }).ToList();


        var stats = new OwnerStatsDto
        {
            TotalRevenue = totalRevenue,
            TotalProviderCost = totalCost,
            NetProfit = totalRevenue - totalCost,
            TodayRevenue = todayRevenue,
            TodayProfit = todayRevenue - todayCost,
            TotalTransactions = totalTx,
            SuccessTransactions = successTx,
            PendingTransactions = pendingTx,
            FailedTransactions = failedTx,
            TotalUsers = userCount,
            TotalGames = gameCount,
            TotalProducts = productCount,
            RefundQueueCount = refundCount,
            DailyRevenue = dailyData
        };

        return ApiResponse<OwnerStatsDto>.Ok(stats);
    }

    private string GetLoyaltyLevel(decimal totalSpent)
    {
        if (totalSpent >= 10_000_000) return "SULTAN IMMORTAL";
        if (totalSpent >= 5_000_000) return "PLATINUM";
        if (totalSpent >= 2_000_000) return "GOLD";
        if (totalSpent >= 500_000) return "SILVER";
        return "BRONZE";
    }
}

using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;
using SassyGurl.Application.Interfaces;

namespace SassyGurl.Api.Services;

public class LoyaltyService : ILoyaltyService
{
    private readonly SassyGurlDbContext _context;
    private readonly ILogger<LoyaltyService> _logger;
    private static readonly Random _random = new Random();

    public LoyaltyService(SassyGurlDbContext context, ILogger<LoyaltyService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> CalculateGachaBonusAsync(string transactionId)
    {
        var transaction = await _context.Transactions
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == transactionId);

        if (transaction == null || transaction.User == null) return 0;

        // Base max gamification gacha is up to 5% of profit to protect margins
        decimal maxPointsValue = transaction.Profit * 0.05m;
        int maxPoints = (int)Math.Max(1, maxPointsValue); // 1 point = Rp 1

        // Multiplier based on tier
        decimal tierMultiplier = transaction.User.Tier switch
        {
            MemberTier.BRONZE => 1.0m,
            MemberTier.SILVER => 1.2m,
            MemberTier.GOLD => 1.5m,
            MemberTier.PLATINUM => 2.0m,
            _ => 1.0m
        };

        maxPoints = (int)(maxPoints * tierMultiplier);

        // Gacha mechanism: random between 10% to 100% of maxPoints
        int minPoints = Math.Max(1, (int)(maxPoints * 0.1m));
        return _random.Next(minPoints, maxPoints + 1);
    }

    public async Task AwardPointsAfterSuccessAsync(string transactionId)
    {
        var transaction = await _context.Transactions
            .Include(t => t.User)
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == transactionId);

        if (transaction == null || transaction.User == null || transaction.OrderStatus != OrderStatus.SUCCESS)
            return;

        int pointsEarned = 0;

        // 1. Check Product Override
        if (transaction.Product.OverridePoints.HasValue)
        {
            pointsEarned += transaction.Product.OverridePoints.Value;
        }
        else
        {
            // Base Rule: 1 point per Rp 1000 spent (can be adjusted)
            pointsEarned += (int)(transaction.TotalAmount / 1000);
        }

        // 2. Gacha Bonus Drop
        int gachaBonus = await CalculateGachaBonusAsync(transactionId);
        pointsEarned += gachaBonus;

        if (pointsEarned <= 0) return;

        // Add Points
        transaction.User.Points += pointsEarned;

        // Record Ledger
        var ledger = new PointLedger
        {
            UserId = transaction.UserId!,
            TransactionId = transactionId,
            Type = MutationType.POINT_EARN,
            Credit = pointsEarned,
            BalanceSnapshot = transaction.User.Points,
            Description = $"Earned points from Invoice {transaction.InvoiceId} (Includes {gachaBonus} Gacha Bonus!)"
        };

        _context.PointLedgers.Add(ledger);
        await _context.SaveChangesAsync();

        // Check if user tier should upgrade
        await UpdateMemberTierAsync(transaction.UserId!);
    }

    public async Task<bool> SpendPointsAsync(string userId, int pointsToSpend, string description, string? transactionId = null)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || user.Points < pointsToSpend) return false;

        user.Points -= pointsToSpend;

        var ledger = new PointLedger
        {
            UserId = userId,
            TransactionId = transactionId,
            Type = MutationType.POINT_SPEND,
            Debit = pointsToSpend,
            BalanceSnapshot = user.Points,
            Description = description
        };

        _context.PointLedgers.Add(ledger);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task UpdateMemberTierAsync(string userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return;

        // Determine total points earned all-time (from PointLedger)
        var totalPointsEarned = await _context.PointLedgers
            .Where(pl => pl.UserId == userId && pl.Type == MutationType.POINT_EARN)
            .SumAsync(pl => pl.Credit);

        MemberTier newTier = MemberTier.BRONZE;

        if (totalPointsEarned >= 100000)
            newTier = MemberTier.PLATINUM;
        else if (totalPointsEarned >= 50000)
            newTier = MemberTier.GOLD;
        else if (totalPointsEarned >= 10000)
            newTier = MemberTier.SILVER;

        if (user.Tier != newTier)
        {
            user.Tier = newTier;
            await _context.SaveChangesAsync();
            _logger.LogInformation("User {UserId} upgraded to Tier {NewTier}", userId, newTier);
        }
    }
}

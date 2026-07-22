using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Services;

public interface IAffiliateService
{
    Task AwardCommissionAsync(string transactionId);
}

public class AffiliateService : IAffiliateService
{
    private readonly SassyGurlDbContext _context;
    private readonly ILogger<AffiliateService> _logger;

    public AffiliateService(SassyGurlDbContext context, ILogger<AffiliateService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task AwardCommissionAsync(string transactionId)
    {
        var transaction = await _context.Transactions
            .Include(t => t.AffiliateUser)
            .FirstOrDefaultAsync(t => t.Id == transactionId);

        if (transaction == null || string.IsNullOrEmpty(transaction.AffiliateUserId))
            return;

        // Ensure we haven't already awarded commission for this transaction
        var existingCommission = await _context.AffiliateCommissions
            .AnyAsync(c => c.TransactionId == transactionId);

        if (existingCommission)
            return;

        // Calculate commission: for example, 2% of PriceSell
        var commissionAmount = transaction.PriceSell * 0.02m;

        if (commissionAmount <= 0) return;

        var commission = new AffiliateCommission
        {
            AffiliateUserId = transaction.AffiliateUserId,
            TransactionId = transaction.Id,
            Amount = commissionAmount,
            CreatedAt = DateTime.UtcNow
        };

        _context.AffiliateCommissions.Add(commission);

        if (transaction.AffiliateUser != null)
        {
            transaction.AffiliateUser.Balance += commissionAmount;
        }

        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Awarded {Amount} commission to Affiliate {AffiliateUserId} for Transaction {TransactionId}", 
            commissionAmount, transaction.AffiliateUserId, transactionId);
    }
}

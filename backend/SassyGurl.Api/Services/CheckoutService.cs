using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;
using SassyGurl.Application.Interfaces;

namespace SassyGurl.Api.Services;

public class CheckoutRequest
{
    public string UserId { get; set; } = null!;
    public string ProductId { get; set; } = null!;
    public string CustomerTarget { get; set; } = null!;
    public string? PromoCode { get; set; }
}

public interface ICheckoutService
{
    Task<string> ProcessCheckoutAsync(CheckoutRequest request);
}

public class CheckoutService : ICheckoutService
{
    private readonly SassyGurlDbContext _dbContext;
    private readonly IVoucherService _voucherService;
    private readonly IOrderFulfillmentQueue _queue;
    private readonly ILogger<CheckoutService> _logger;

    public CheckoutService(
        SassyGurlDbContext dbContext,
        IVoucherService voucherService,
        IOrderFulfillmentQueue queue,
        ILogger<CheckoutService> logger)
    {
        _dbContext = dbContext;
        _voucherService = voucherService;
        _queue = queue;
        _logger = logger;
    }

    public async Task<string> ProcessCheckoutAsync(CheckoutRequest request)
    {
        // ── ATOMIC TRANSACTION: Unit of Work Pattern ──
        using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            // 1. Fetch User and Product
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId);
            if (user == null) throw new InvalidOperationException("User not found.");

            var product = await _dbContext.Products
                .Include(p => p.Game)
                .FirstOrDefaultAsync(p => p.Id == request.ProductId);
            
            if (product == null || !product.IsActive) 
                throw new InvalidOperationException("Product is unavailable.");

            decimal finalPrice = product.PriceSell;
            Promo? validPromo = null;

            // 2. Validate Voucher (Step 1 of Prompt)
            if (!string.IsNullOrWhiteSpace(request.PromoCode))
            {
                validPromo = await _voucherService.ValidateVoucherAsync(request.PromoCode, finalPrice);
                if (validPromo != null)
                {
                    decimal discount = validPromo.Type == PromoType.PERCENTAGE 
                        ? finalPrice * (validPromo.Value / 100) 
                        : validPromo.Value;
                        
                    if (validPromo.MaxDiscount.HasValue && discount > validPromo.MaxDiscount.Value)
                    {
                        discount = validPromo.MaxDiscount.Value;
                    }

                    finalPrice -= discount;
                    if (finalPrice < 0) finalPrice = 0;

                    // Increment usage
                    validPromo.UsedCount++;
                    _dbContext.Promos.Update(validPromo);
                }
            }

            // 3. Deduct Balance (Step 2 of Prompt)
            if (user.Balance < finalPrice)
            {
                throw new InvalidOperationException("Insufficient balance.");
            }

            user.Balance -= finalPrice;
            
            // Record to Wallet Ledger
            var ledger = new WalletLedger
            {
                UserId = user.Id,
                Type = MutationType.PAYMENT,
                Debit = finalPrice,
                Credit = 0,
                BalanceSnapshot = user.Balance,
                Description = $"Purchase of {product.Name} for {request.CustomerTarget}"
            };
            _dbContext.WalletLedgers.Add(ledger);

            // Mock Wallet Payment Method
            var walletPayment = await _dbContext.PaymentMethods.FirstOrDefaultAsync(pm => pm.Code == "WALLET");
            if (walletPayment == null) 
            {
                walletPayment = new PaymentMethod { Code = "WALLET", Name = "SassyGurl Wallet", Type = PaymentType.EWALLET, IsActive = true };
                _dbContext.PaymentMethods.Add(walletPayment);
                await _dbContext.SaveChangesAsync();
            }

            // 4. Create Order (Step 3 of Prompt)
            var newOrder = new Transaction
            {
                InvoiceId = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 6).ToUpper()}",
                UserId = user.Id,
                GameId = product.GameId,
                ProductId = product.Id,
                Sku = product.Sku,
                DenomName = product.Name,
                TargetId = request.CustomerTarget,
                TotalAmount = finalPrice,
                PaymentStatus = PaymentStatus.PAID, // Already paid via balance deduction
                OrderStatus = OrderStatus.PROCESSING, // T-06 fix: Start as PROCESSING since it's already PAID
                PaymentId = walletPayment.Id,
                PromoId = validPromo?.Id
            };
            _dbContext.Transactions.Add(newOrder);

            // Add initial history record
            _dbContext.OrderStatusHistories.Add(new OrderStatusHistory
            {
                Transaction = newOrder, // Use navigation property since ID isn't generated yet
                FromStatus = OrderStatus.DRAFT,
                ToStatus = OrderStatus.PROCESSING,
                ChangedBy = "system",
                Reason = "Checkout wallet payment"
            });

            // Save all changes to the database
            // If Optimistic Concurrency fails here (e.g. balance changed), DbUpdateConcurrencyException is thrown.
            await _dbContext.SaveChangesAsync();

            // Commit the transaction
            await transaction.CommitAsync();

            _logger.LogInformation("Successfully processed checkout {InvoiceId} for user {UserId}", newOrder.InvoiceId, user.Id);

            // 5. Trigger Failover Provider / Fulfillment Queue (Step 4 of Prompt)
            await _queue.EnqueueOrderAsync(new OrderFulfillmentRequest
            {
                TransactionId = newOrder.Id,
                OrderNumber = newOrder.InvoiceId,
                Sku = newOrder.Sku,
                CustomerTarget = newOrder.TargetId,
                ProviderId = product.ProviderId
            });

            return newOrder.InvoiceId;
        }
        catch (DbUpdateConcurrencyException ex)
        {
            await transaction.RollbackAsync();
            _logger.LogWarning(ex, "Concurrency conflict occurred during checkout for user {UserId}", request.UserId);
            throw new InvalidOperationException("Your balance was modified during checkout. Please try again.");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Checkout transaction failed and was rolled back for user {UserId}", request.UserId);
            throw;
        }
    }
}

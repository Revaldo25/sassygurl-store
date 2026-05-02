using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.DTOs.Transaction;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;

namespace SassyGurl.Api.Services;

public interface ITransactionService
{
    Task<ApiResponse<TransactionResponseDto>> CreateTransactionAsync(CreateTransactionDto request, string? userId);
    Task<ApiResponse<string>> UpdateTransactionStatusAsync(string transactionId, string status);
}

public class TransactionService : ITransactionService
{
    private readonly SassyGurlDbContext _context;

    public TransactionService(SassyGurlDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<TransactionResponseDto>> CreateTransactionAsync(CreateTransactionDto request, string? userId)
    {
        var product = await _context.Products
            .Include(p => p.Game)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId);

        if (product == null || !product.IsActive)
            return ApiResponse<TransactionResponseDto>.Fail("Produk tidak ditemukan atau sedang tidak aktif.");

        var payment = await _context.PaymentMethods.FirstOrDefaultAsync(p => p.Id == request.PaymentMethod);
        if (payment == null || !payment.IsActive)
            return ApiResponse<TransactionResponseDto>.Fail("Metode pembayaran tidak valid.");

        var subTotal = product.PriceSell * request.Quantity;
        var adminFee = payment.FeeFlat + (subTotal * payment.FeePercent / 100);
        var taxVat = 0m;
        var discount = 0m;
        var notifFee = request.WaNotif ? 500m : 0m;

        var totalAmount = subTotal + adminFee + taxVat + notifFee - discount;
        var profit = (product.PriceSell - product.PriceModal) * request.Quantity;

        var invoiceId = $"INV-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{new Random().Next(100, 999)}";

        var transaction = new Transaction
        {
            InvoiceId = invoiceId,
            UserId = userId,
            GameId = product.GameId,
            ProductId = product.Id,
            Sku = product.Sku,
            DenomName = product.Name,
            TargetId = request.TargetId,
            ZoneId = request.ZoneId,
            Email = request.Email,
            Whatsapp = request.Whatsapp,
            PaymentId = payment.Id,
            
            PriceModal = product.PriceModal * request.Quantity,
            PriceSell = product.PriceSell * request.Quantity,
            AdminFee = adminFee + notifFee,
            TaxVat = taxVat,
            Discount = discount,
            TotalAmount = totalAmount,
            Profit = profit,
            
            PaymentStatus = PaymentStatus.UNPAID,
            OrderStatus = OrderStatus.PENDING,
            ExpiredAt = DateTime.UtcNow.AddDays(1)
        };

        _context.Transactions.Add(transaction);

        // Simulated Token for Midtrans
        var simulatedToken = $"SNAP-{invoiceId}-{Guid.NewGuid().ToString().Substring(0, 6).ToUpper()}";
        transaction.PaymentRef = simulatedToken;

        await _context.SaveChangesAsync();

        return ApiResponse<TransactionResponseDto>.Ok(new TransactionResponseDto
        {
            InvoiceId = invoiceId,
            PaymentToken = simulatedToken
        }, "Transaksi berhasil dibuat!");
    }

    public async Task<ApiResponse<string>> UpdateTransactionStatusAsync(string transactionId, string statusStr)
    {
        if (!Enum.TryParse<OrderStatus>(statusStr, true, out var newStatus))
            return ApiResponse<string>.Fail("Status tidak valid.");

        var transaction = await _context.Transactions.FindAsync(transactionId);
        if (transaction == null) return ApiResponse<string>.Fail("Transaksi tidak ditemukan.");

        transaction.OrderStatus = newStatus;
        if (newStatus == OrderStatus.SUCCESS && transaction.PaymentStatus != PaymentStatus.PAID)
        {
            transaction.PaymentStatus = PaymentStatus.PAID; // Admin forced success
            transaction.PaidAt = DateTime.UtcNow;
            transaction.CompletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return ApiResponse<string>.Ok("Status berhasil diubah", $"Status berhasil diubah ke {newStatus}");
    }
}

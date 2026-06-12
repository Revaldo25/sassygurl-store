using Microsoft.AspNetCore.SignalR;
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
    private readonly IWhatsAppService _whatsApp;
    private readonly IHubContext<SassyGurl.Api.Hubs.NotificationHub> _hub;
    private readonly IOrderTransitionHelper _transition;
    private readonly IMidtransService _midtrans;

    public TransactionService(
        SassyGurlDbContext context, 
        IWhatsAppService whatsApp,
        IHubContext<SassyGurl.Api.Hubs.NotificationHub> hub,
        IOrderTransitionHelper transition,
        IMidtransService midtrans)
    {
        _context = context;
        _whatsApp = whatsApp;
        _hub = hub;
        _transition = transition;
        _midtrans = midtrans;
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

        var invoiceId = $"INV-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Random.Shared.Next(1000, 9999)}";

        var transaction = new Transaction
        {
            InvoiceId = invoiceId,
            UserId = userId,
            GameId = product.GameId,
            ProductId = product.Id,
            Sku = product.Sku,
            DenomName = request.Quantity > 1 ? $"{product.Name} (x{request.Quantity})" : product.Name,
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

        // Generate real SnapToken from Midtrans Sandbox
        var productNameWithQty = request.Quantity > 1 ? $"{product.Name} (x{request.Quantity})" : product.Name;
        var snapToken = await _midtrans.GenerateSnapTokenAsync(
            invoiceId,
            totalAmount,
            productNameWithQty,
            "SassyGurl User",
            request.Email ?? "",
            request.Whatsapp ?? "");

        if (string.IsNullOrEmpty(snapToken))
        {
            return ApiResponse<TransactionResponseDto>.Fail("Gagal membuat token pembayaran. Silakan coba metode lain.");
        }

        transaction.PaymentRef = snapToken;
        await _context.SaveChangesAsync();

        // WhatsApp: Notify "Pesanan Dibuat — Menunggu Pembayaran"
        _ = _whatsApp.SendOrderCreatedAsync(
            request.Whatsapp ?? "",
            invoiceId,
            product.Game?.Name ?? "",
            product.Name,
            totalAmount);

        return ApiResponse<TransactionResponseDto>.Ok(new TransactionResponseDto
        {
            InvoiceId = invoiceId,
            PaymentToken = snapToken
        }, "Transaksi berhasil dibuat!");
    }

    public async Task<ApiResponse<string>> UpdateTransactionStatusAsync(string transactionId, string statusStr)
    {
        if (!Enum.TryParse<OrderStatus>(statusStr, true, out var newStatus))
            return ApiResponse<string>.Fail("Status tidak valid.");

        var transaction = await _context.Transactions.FindAsync(transactionId);
        if (transaction == null) return ApiResponse<string>.Fail("Transaksi tidak ditemukan.");

        // ── Master Plan §8: Validate transition via state machine ──────
        try
        {
            _transition.TransitionStatus(
                transaction,
                newStatus,
                changedBy: "admin",
                reason: $"Manual status update to {newStatus}");
        }
        catch (InvalidOperationException ex)
        {
            return ApiResponse<string>.Fail(ex.Message);
        }

        bool isJustSuccess = false;
        if (newStatus == OrderStatus.SUCCESS && transaction.PaymentStatus != PaymentStatus.PAID)
        {
            transaction.PaymentStatus = PaymentStatus.PAID; // Admin forced success
            transaction.PaidAt = DateTime.UtcNow;
            transaction.CompletedAt = DateTime.UtcNow;
            isJustSuccess = true;
        }

        await _context.SaveChangesAsync();

        if (isJustSuccess || newStatus == OrderStatus.SUCCESS)
        {
            var game = await _context.Games.FindAsync(transaction.GameId);
            var phone = transaction.Whatsapp ?? "";
            var masked = string.IsNullOrEmpty(phone) ? "User" : phone.Substring(0, Math.Min(4, phone.Length)) + "***";
            
            await SassyGurl.Api.Hubs.NotificationBroadcaster.BroadcastPublicTransaction(
                _hub,
                new SassyGurl.Api.Hubs.PublicTransactionPayload(
                    MaskedTarget: masked,
                    GameName: game?.Name ?? "Game",
                    ProductName: transaction.DenomName ?? "Item",
                    Timestamp: DateTime.UtcNow
                )
            );
        }

        return ApiResponse<string>.Ok("Status berhasil diubah", $"Status berhasil diubah ke {newStatus}");
    }
}


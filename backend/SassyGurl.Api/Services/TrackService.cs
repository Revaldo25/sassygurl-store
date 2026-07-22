using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.DTOs.Transaction;
using SassyGurl.Api.Models.Enums;

namespace SassyGurl.Api.Services;

public interface ITrackService
{
    Task<ApiResponse<TrackResponseDto>> TrackOrderAsync(string invoiceId);
}

public class TrackService : ITrackService
{
    private readonly SassyGurlDbContext _context;
    private readonly IMidtransService _midtrans;
    private readonly IPaymentService _paymentService;

    public TrackService(SassyGurlDbContext context, IMidtransService midtrans, IPaymentService paymentService)
    {
        _context = context;
        _midtrans = midtrans;
        _paymentService = paymentService;
    }

    public async Task<ApiResponse<TrackResponseDto>> TrackOrderAsync(string invoiceId)
    {
        var transaction = await _context.Transactions
            .AsNoTracking()
            .Include(t => t.Game)
            .Include(t => t.Product)
            .Include(t => t.Payment)
            .FirstOrDefaultAsync(t => t.InvoiceId == invoiceId);

        if (transaction == null)
            return ApiResponse<TrackResponseDto>.Fail("Pesanan tidak ditemukan. Periksa kembali Invoice ID Anda.");

        // AUTO-SYNC: If pending, proactively check Midtrans status to bypass Webhook issues (e.g. Ngrok)
        if (transaction.PaymentStatus == PaymentStatus.UNPAID || transaction.PaymentStatus == PaymentStatus.PENDING)
        {
            var statusPayload = await _midtrans.GetTransactionStatusAsync(invoiceId);
            if (statusPayload != null)
            {
                // Force process the payload, skipping signature because we fetched it directly from API
                await _paymentService.ProcessMidtransWebhookAsync(statusPayload, "127.0.0.1", true);

                // Re-fetch transaction after potential update
                transaction = await _context.Transactions
                    .AsNoTracking()
                    .Include(t => t.Game)
                    .Include(t => t.Product)
                    .Include(t => t.Payment)
                    .FirstOrDefaultAsync(t => t.InvoiceId == invoiceId);
            }
        }

        var dto = new TrackResponseDto
        {
            InvoiceId = transaction!.InvoiceId,
            GameName = transaction.Game.Name,
            ProductName = transaction.DenomName,
            TargetId = transaction.TargetId,
            ZoneId = transaction.ZoneId,
            TotalAmount = transaction.TotalAmount,
            PaymentMethod = transaction.Payment.Name,
            PaymentStatus = transaction.PaymentStatus.ToString(),
            OrderStatus = transaction.OrderStatus.ToString(),
            Sn = transaction.Sn,
            CreatedAt = transaction.CreatedAt,
            PaidAt = transaction.PaidAt,
            CompletedAt = transaction.CompletedAt,
            PaymentToken = transaction.PaymentRef
        };

        return ApiResponse<TrackResponseDto>.Ok(dto);
    }
}

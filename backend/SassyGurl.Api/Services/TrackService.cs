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

    public TrackService(SassyGurlDbContext context)
    {
        _context = context;
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

        var dto = new TrackResponseDto
        {
            InvoiceId = transaction.InvoiceId,
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
            CompletedAt = transaction.CompletedAt
        };

        return ApiResponse<TrackResponseDto>.Ok(dto);
    }
}

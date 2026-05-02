using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models.Enums;

namespace SassyGurl.Api.Services;

public class ValidatePromoRequestDto
{
    public string Code { get; set; } = null!;
    public decimal Amount { get; set; }
}

public class PromoResultDto
{
    public string Code { get; set; } = null!;
    public decimal Discount { get; set; }
    public string Description { get; set; } = null!;
}

public interface IPromoService
{
    Task<ApiResponse<PromoResultDto>> ValidatePromoAsync(ValidatePromoRequestDto request);
}

public class PromoService : IPromoService
{
    private readonly SassyGurlDbContext _context;

    public PromoService(SassyGurlDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PromoResultDto>> ValidatePromoAsync(ValidatePromoRequestDto request)
    {
        var promo = await _context.Promos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code == request.Code.ToUpper() && p.IsActive);

        if (promo == null)
            return ApiResponse<PromoResultDto>.Fail("Kode promo tidak valid atau sudah kadaluarsa.");

        // Check quota
        if (promo.UsedCount >= promo.Quota)
            return ApiResponse<PromoResultDto>.Fail("Kuota promo sudah habis.");

        // Check date range
        var now = DateTime.UtcNow;
        if (now < promo.StartDate || now > promo.EndDate)
            return ApiResponse<PromoResultDto>.Fail("Kode promo sudah tidak berlaku.");

        // Check minimum transaction
        if (request.Amount < promo.MinTransaction)
            return ApiResponse<PromoResultDto>.Fail(
                $"Minimum transaksi untuk promo ini adalah Rp {promo.MinTransaction:N0}");

        // Calculate discount
        decimal discount = promo.Type switch
        {
            PromoType.PERCENTAGE => request.Amount * promo.Value / 100m,
            PromoType.FLAT => promo.Value,
            _ => 0m
        };

        // Cap at max discount if set
        if (promo.MaxDiscount.HasValue && discount > promo.MaxDiscount.Value)
            discount = promo.MaxDiscount.Value;

        return ApiResponse<PromoResultDto>.Ok(new PromoResultDto
        {
            Code = promo.Code,
            Discount = discount,
            Description = $"Kode Promo Berhasil! Kamu hemat Rp {discount:N0}"
        }, "Promo berhasil diterapkan!");
    }
}

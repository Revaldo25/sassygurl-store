using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models;
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

public class PromoDto
{
    public string Id { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string Type { get; set; } = null!;
    public decimal Value { get; set; }
    public decimal? MaxDiscount { get; set; }
    public decimal MinTransaction { get; set; }
    public int Quota { get; set; }
    public int UsedCount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
}

public class CreatePromoDto
{
    public string Code { get; set; } = null!;
    public string Type { get; set; } = "PERCENTAGE";
    public decimal Value { get; set; }
    public decimal? MaxDiscount { get; set; }
    public decimal MinTransaction { get; set; }
    public int Quota { get; set; } = 100;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public interface IPromoService
{
    Task<ApiResponse<PromoResultDto>> ValidatePromoAsync(ValidatePromoRequestDto request);
    Task<ApiResponse<List<PromoDto>>> GetAllPromosAsync();
    Task<ApiResponse<PromoDto>> CreatePromoAsync(CreatePromoDto dto);
    Task<ApiResponse<PromoDto>> UpdatePromoAsync(string id, CreatePromoDto dto);
    Task<ApiResponse<string>> DeletePromoAsync(string id);
    Task<ApiResponse<string>> TogglePromoAsync(string id);
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

        if (promo.UsedCount >= promo.Quota)
            return ApiResponse<PromoResultDto>.Fail("Kuota promo sudah habis.");

        var now = DateTime.UtcNow;
        if (now < promo.StartDate || now > promo.EndDate)
            return ApiResponse<PromoResultDto>.Fail("Kode promo sudah tidak berlaku.");

        if (request.Amount < promo.MinTransaction)
            return ApiResponse<PromoResultDto>.Fail(
                $"Minimum transaksi untuk promo ini adalah Rp {promo.MinTransaction:N0}");

        decimal discount = promo.Type switch
        {
            PromoType.PERCENTAGE => request.Amount * promo.Value / 100m,
            PromoType.FLAT => promo.Value,
            _ => 0m
        };

        if (promo.MaxDiscount.HasValue && discount > promo.MaxDiscount.Value)
            discount = promo.MaxDiscount.Value;

        return ApiResponse<PromoResultDto>.Ok(new PromoResultDto
        {
            Code = promo.Code,
            Discount = discount,
            Description = $"Kode Promo Berhasil! Kamu hemat Rp {discount:N0}"
        }, "Promo berhasil diterapkan!");
    }

    public async Task<ApiResponse<List<PromoDto>>> GetAllPromosAsync()
    {
        var promos = await _context.Promos
            .AsNoTracking()
            .OrderByDescending(p => p.StartDate)
            .Select(p => new PromoDto
            {
                Id = p.Id,
                Code = p.Code,
                Type = p.Type.ToString(),
                Value = p.Value,
                MaxDiscount = p.MaxDiscount,
                MinTransaction = p.MinTransaction,
                Quota = p.Quota,
                UsedCount = p.UsedCount,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                IsActive = p.IsActive
            })
            .ToListAsync();

        return ApiResponse<List<PromoDto>>.Ok(promos);
    }

    public async Task<ApiResponse<PromoDto>> CreatePromoAsync(CreatePromoDto dto)
    {
        var exists = await _context.Promos.AnyAsync(p => p.Code == dto.Code.ToUpper());
        if (exists) return ApiResponse<PromoDto>.Fail("Kode promo sudah digunakan.");

        var promo = new Promo
        {
            Code = dto.Code.ToUpper(),
            Type = Enum.Parse<PromoType>(dto.Type, true),
            Value = dto.Value,
            MaxDiscount = dto.MaxDiscount,
            MinTransaction = dto.MinTransaction,
            Quota = dto.Quota,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsActive = true
        };

        _context.Promos.Add(promo);
        await _context.SaveChangesAsync();

        return ApiResponse<PromoDto>.Ok(new PromoDto
        {
            Id = promo.Id, Code = promo.Code, Type = promo.Type.ToString(),
            Value = promo.Value, MaxDiscount = promo.MaxDiscount,
            MinTransaction = promo.MinTransaction, Quota = promo.Quota,
            UsedCount = 0, StartDate = promo.StartDate,
            EndDate = promo.EndDate, IsActive = promo.IsActive
        }, "Promo berhasil dibuat!");
    }

    public async Task<ApiResponse<PromoDto>> UpdatePromoAsync(string id, CreatePromoDto dto)
    {
        var promo = await _context.Promos.FindAsync(id);
        if (promo == null) return ApiResponse<PromoDto>.Fail("Promo tidak ditemukan.");

        promo.Code = dto.Code.ToUpper();
        promo.Type = Enum.Parse<PromoType>(dto.Type, true);
        promo.Value = dto.Value;
        promo.MaxDiscount = dto.MaxDiscount;
        promo.MinTransaction = dto.MinTransaction;
        promo.Quota = dto.Quota;
        promo.StartDate = dto.StartDate;
        promo.EndDate = dto.EndDate;

        await _context.SaveChangesAsync();

        return ApiResponse<PromoDto>.Ok(new PromoDto
        {
            Id = promo.Id, Code = promo.Code, Type = promo.Type.ToString(),
            Value = promo.Value, MaxDiscount = promo.MaxDiscount,
            MinTransaction = promo.MinTransaction, Quota = promo.Quota,
            UsedCount = promo.UsedCount, StartDate = promo.StartDate,
            EndDate = promo.EndDate, IsActive = promo.IsActive
        }, "Promo berhasil diupdate!");
    }

    public async Task<ApiResponse<string>> DeletePromoAsync(string id)
    {
        var promo = await _context.Promos.FindAsync(id);
        if (promo == null) return ApiResponse<string>.Fail("Promo tidak ditemukan.");

        _context.Promos.Remove(promo);
        await _context.SaveChangesAsync();
        return ApiResponse<string>.Ok("OK", "Promo berhasil dihapus.");
    }

    public async Task<ApiResponse<string>> TogglePromoAsync(string id)
    {
        var promo = await _context.Promos.FindAsync(id);
        if (promo == null) return ApiResponse<string>.Fail("Promo tidak ditemukan.");

        promo.IsActive = !promo.IsActive;
        await _context.SaveChangesAsync();
        return ApiResponse<string>.Ok("OK", $"Promo {(promo.IsActive ? "diaktifkan" : "dinonaktifkan")}.");
    }
}

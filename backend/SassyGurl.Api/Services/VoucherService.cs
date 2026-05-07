using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Services;

public interface IVoucherService
{
    Task<Promo?> ValidateVoucherAsync(string code, decimal transactionAmount);
}

public class VoucherService : IVoucherService
{
    private readonly SassyGurlDbContext _dbContext;
    private readonly IDistributedCache _cache;

    public VoucherService(SassyGurlDbContext dbContext, IDistributedCache cache)
    {
        _dbContext = dbContext;
        _cache = cache;
    }

    public async Task<Promo?> ValidateVoucherAsync(string code, decimal transactionAmount)
    {
        code = code.Trim().ToUpper();
        var cacheKey = $"Voucher:{code}";

        // 1. Try fetching from Redis Cache first to reduce DB load
        var cachedVoucher = await _cache.GetStringAsync(cacheKey);
        Promo? voucher;

        if (string.IsNullOrEmpty(cachedVoucher))
        {
            // 2. Not in cache, fetch from DB
            voucher = await _dbContext.Promos.FirstOrDefaultAsync(p => p.Code.ToUpper() == code);
            
            if (voucher != null)
            {
                // Cache the voucher details. Cache expires end of day or when voucher expires.
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1) 
                };
                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(voucher), options);
            }
        }
        else
        {
            voucher = JsonSerializer.Deserialize<Promo>(cachedVoucher);
        }

        // 3. Validation Logic
        if (voucher == null) return null; // Not found

        if (!voucher.IsActive) return null;

        if (DateTime.UtcNow < voucher.StartDate || DateTime.UtcNow > voucher.EndDate) return null;

        if (voucher.UsedCount >= voucher.Quota) return null;

        if (transactionAmount < voucher.MinTransaction) return null; // Transaction doesn't meet minimum requirements

        return voucher; // Valid
    }
}

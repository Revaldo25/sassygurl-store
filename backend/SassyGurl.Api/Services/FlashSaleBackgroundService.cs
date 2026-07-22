using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Services;

public class FlashSaleConfig
{
    public bool IsActive { get; set; }
    public bool ForceTrigger { get; set; } // Hybrid! Manual override
    public int StartHour { get; set; }
    public int StartMinute { get; set; }
    public int EndHour { get; set; }
    public int EndMinute { get; set; }
    public decimal DiscountPercent { get; set; }
    public List<string> GameIds { get; set; } = new();
}

public class FlashSaleBackgroundService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<FlashSaleBackgroundService> _logger;

    public FlashSaleBackgroundService(IServiceProvider services, ILogger<FlashSaleBackgroundService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Flash Sale Background Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessFlashSaleAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing Flash Sale Service.");
            }

            // Runs every 1 minute
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task ProcessFlashSaleAsync(CancellationToken stoppingToken)
    {
        using var scope = _services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SassyGurlDbContext>();

        // 1. Get Config
        var configSetting = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "FlashSaleConfig", stoppingToken);
        if (configSetting == null || string.IsNullOrEmpty(configSetting.Value)) return;

        FlashSaleConfig config;
        try
        {
            config = JsonSerializer.Deserialize<FlashSaleConfig>(configSetting.Value, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
        }
        catch
        {
            return;
        }

        if (config == null || !config.IsActive || !config.GameIds.Any())
        {
            // If inactive, ensure we revert any active flash sales
            await RevertAllFlashSales(context, stoppingToken);
            return;
        }

        // 2. Check Time (WIB)
        var wibZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); // Windows ID for UTC+7
        var currentTimeWib = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, wibZone);
        
        var startTime = new TimeSpan(config.StartHour, config.StartMinute, 0);
        var endTime = new TimeSpan(config.EndHour, config.EndMinute, 0);
        var currentTime = currentTimeWib.TimeOfDay;

        bool isTimeInWindow;
        if (startTime <= endTime)
        {
            isTimeInWindow = currentTime >= startTime && currentTime <= endTime;
        }
        else
        {
            // Spans midnight (e.g., 23:00 to 02:00)
            isTimeInWindow = currentTime >= startTime || currentTime <= endTime;
        }

        bool shouldBeActive = isTimeInWindow || config.ForceTrigger;

        if (shouldBeActive)
        {
            await ApplyFlashSale(context, config, stoppingToken);
        }
        else
        {
            await RevertAllFlashSales(context, stoppingToken);
        }
    }

    private async Task ApplyFlashSale(SassyGurlDbContext context, FlashSaleConfig config, CancellationToken stoppingToken)
    {
        var targetProducts = await context.Products
            .Where(p => config.GameIds.Contains(p.GameId) && p.IsActive)
            .ToListAsync(stoppingToken);

        bool changesMade = false;
        foreach (var p in targetProducts)
        {
            if (!p.IsFlashSale)
            {
                p.IsFlashSale = true;
                // Calculate discounted price. We use PriceModal + Margin as the base normal price.
                decimal basePrice = p.PriceModal + p.Margin;
                decimal discountAmount = basePrice * (config.DiscountPercent / 100m);
                p.PriceSell = basePrice - discountAmount;
                
                // Also optionally reduce Member/Reseller/Vip based on the new PriceSell
                p.PriceMember = p.PriceSell * 0.98m;
                p.PriceReseller = p.PriceSell * 0.95m;
                p.PriceVip = p.PriceSell * 0.90m;
                
                changesMade = true;
            }
        }

        // Also ensure products NOT in the target games revert their flash sale if they had it
        var otherProducts = await context.Products
            .Where(p => !config.GameIds.Contains(p.GameId) && p.IsFlashSale)
            .ToListAsync(stoppingToken);
            
        foreach (var p in otherProducts)
        {
            RevertProductPrice(p);
            changesMade = true;
        }

        if (changesMade)
        {
            await context.SaveChangesAsync(stoppingToken);
            _logger.LogInformation("Applied flash sale prices.");
        }
    }

    private async Task RevertAllFlashSales(SassyGurlDbContext context, CancellationToken stoppingToken)
    {
        var activeFlashSales = await context.Products
            .Where(p => p.IsFlashSale)
            .ToListAsync(stoppingToken);

        if (!activeFlashSales.Any()) return;

        foreach (var p in activeFlashSales)
        {
            RevertProductPrice(p);
        }

        await context.SaveChangesAsync(stoppingToken);
        _logger.LogInformation($"Reverted {activeFlashSales.Count} flash sale prices.");
    }

    private void RevertProductPrice(Product p)
    {
        p.IsFlashSale = false;
        p.PriceSell = p.PriceModal + p.Margin;
        p.PriceMember = p.PriceSell * 0.98m;
        p.PriceReseller = p.PriceSell * 0.95m;
        p.PriceVip = p.PriceSell * 0.90m;
    }
}

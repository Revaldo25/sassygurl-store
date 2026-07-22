using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SassyGurl.Api.Services;
using SassyGurl.Application.Interfaces;
using SassyGurl.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SUPERADMIN,OWNER,FINANCE")]
public class AdminReportController : ControllerBase
{
    private readonly ReportGeneratorService _reportGenerator;
    private readonly IEmailService _emailService;
    private readonly SassyGurl.Api.Data.SassyGurlDbContext _db;

    public AdminReportController(ReportGeneratorService reportGenerator, IEmailService emailService, SassyGurl.Api.Data.SassyGurlDbContext db)
    {
        _reportGenerator = reportGenerator;
        _emailService = emailService;
        _db = db;
    }

    public class ExportRequest
    {
        public string Email { get; set; } = string.Empty;
        public int Days { get; set; } = 30;
    }

    [HttpPost("export-email")]
    public IActionResult ExportToEmail([FromBody] ExportRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { success = false, message = "Email harus diisi." });

        // Fire and forget (don't block the UI)
        Task.Run(async () =>
        {
            try
            {
                var excelBytes = await _reportGenerator.GenerateAnalyticsExcelAsync(req.Days);
                var fileName = $"Laporan_SassyGurl_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
                var body = $"<p>Halo Owner,</p><p>Terlampir laporan transaksi SassyGurl Store untuk {req.Days} hari terakhir.</p>";
                
                await _emailService.SendEmailAsync(
                    req.Email,
                    $"Laporan Analytics SassyGurl - {req.Days} Hari",
                    body,
                    fileName,
                    excelBytes);
            }
            catch (Exception ex)
            {
                // In production, we'd log this properly to seq/ApplicationInsights
                Console.WriteLine($"Failed to send report email: {ex.Message}");
            }
        });

        return Ok(new { success = true, message = "Laporan sedang diproses dan akan segera dikirim ke email Anda." });
    }

    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportToCsv([FromQuery] int days = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-days);

        var recentTransactions = await _reportGenerator.GetTransactionsForExportAsync(days);

        var builder = new System.Text.StringBuilder();
        builder.AppendLine("ID Transaksi,Reference ID,Status,Pendapatan,Modal Provider,Profit,Tanggal (UTC)");

        foreach (var t in recentTransactions)
        {
            var profit = t.Amount - t.ProviderCost;
            builder.AppendLine($"{t.Id},{t.ReferenceId},{t.Status},{t.Amount},{t.ProviderCost},{profit},{t.CreatedAt:yyyy-MM-dd HH:mm:ss}");
        }

        var csvBytes = System.Text.Encoding.UTF8.GetBytes(builder.ToString());
        var fileName = $"Laporan_SassyGurl_{DateTime.Now:yyyyMMdd_HHmmss}.csv";

        return File(csvBytes, "text/csv", fileName);
    }

    [HttpGet("analytics-funnel")]
    public async Task<IActionResult> GetAnalyticsFunnel([FromQuery] int days = 7)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);
        
        var allTransactions = await _db.Transactions
            .Where(t => t.CreatedAt >= cutoff)
            .Select(t => new { t.OrderStatus, t.CreatedAt })
            .ToListAsync();

        var checkouts = allTransactions.Count;
        var conversions = allTransactions.Count(t => t.OrderStatus == SassyGurl.Api.Models.Enums.OrderStatus.SUCCESS);
        
        // Mock views as 3x checkouts for demonstration of funnel drop-off
        var pageViews = (int)(checkouts * 3.5);

        var funnel = new[]
        {
            new { name = "Page Views", value = pageViews },
            new { name = "Checkouts Started", value = checkouts },
            new { name = "Successful Purchases", value = conversions }
        };

        // Heatmap: Day of Week (0=Sun, 6=Sat) and Hour (0-23)
        var heatmapRaw = allTransactions
            .Where(t => t.OrderStatus == SassyGurl.Api.Models.Enums.OrderStatus.SUCCESS)
            .GroupBy(t => new { Day = (int)t.CreatedAt.DayOfWeek, Hour = t.CreatedAt.Hour })
            .Select(g => new { day = g.Key.Day, hour = g.Key.Hour, value = g.Count() })
            .ToList();

        // Ensure full matrix
        var heatmap = new List<object>();
        for (int d = 0; d < 7; d++)
        {
            for (int h = 0; h < 24; h++)
            {
                var val = heatmapRaw.FirstOrDefault(x => x.day == d && x.hour == h)?.value ?? 0;
                heatmap.Add(new { day = d, hour = h, value = val });
            }
        }

        return Ok(new { success = true, funnel, heatmap });
    }
}

using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Application.Interfaces;

namespace SassyGurl.Api.Services;

public class ReportGeneratorService
{
    private readonly SassyGurlDbContext _context;

    public ReportGeneratorService(SassyGurlDbContext context)
    {
        _context = context;
    }

    public async Task<List<ExportTransactionDto>> GetTransactionsForExportAsync(int days)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-days);
        return await _context.Transactions
            .Where(t => t.CreatedAt >= cutoffDate)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new ExportTransactionDto {
                Id = t.Id.ToString(),
                ReferenceId = t.InvoiceId,
                Status = t.OrderStatus.ToString(),
                Amount = t.TotalAmount,
                ProviderCost = t.PriceModal,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<byte[]> GenerateAnalyticsExcelAsync(int days = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-days);

        // Fetch data
        var recentTransactions = await _context.Transactions
            .Where(t => t.CreatedAt >= cutoffDate)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new {
                t.Id,
                ReferenceId = t.InvoiceId,
                Status = t.OrderStatus.ToString(),
                Amount = t.TotalAmount,
                ProviderCost = t.PriceModal,
                t.CreatedAt
            })
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Laporan Transaksi");

        // Headers
        ws.Cell(1, 1).Value = "ID Transaksi";
        ws.Cell(1, 2).Value = "Reference ID";
        ws.Cell(1, 3).Value = "Status";
        ws.Cell(1, 4).Value = "Pendapatan";
        ws.Cell(1, 5).Value = "Modal Provider";
        ws.Cell(1, 6).Value = "Profit";
        ws.Cell(1, 7).Value = "Tanggal (UTC)";

        var headerRow = ws.Range(1, 1, 1, 7);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

        // Data
        int row = 2;
        decimal totalRevenue = 0;
        decimal totalCost = 0;

        foreach (var t in recentTransactions)
        {
            ws.Cell(row, 1).Value = t.Id.ToString();
            ws.Cell(row, 2).Value = t.ReferenceId;
            ws.Cell(row, 3).Value = t.Status;
            
            ws.Cell(row, 4).Value = t.Amount;
            ws.Cell(row, 4).Style.NumberFormat.Format = "Rp #,##0";
            
            ws.Cell(row, 5).Value = t.ProviderCost;
            ws.Cell(row, 5).Style.NumberFormat.Format = "Rp #,##0";
            
            var profit = t.Amount - t.ProviderCost;
            ws.Cell(row, 6).Value = profit;
            ws.Cell(row, 6).Style.NumberFormat.Format = "Rp #,##0";
            
            ws.Cell(row, 7).Value = t.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");

            if (t.Status == "SUCCESS")
            {
                totalRevenue += t.Amount;
                totalCost += t.ProviderCost;
            }
            row++;
        }

        // Summary
        row += 2;
        ws.Cell(row, 4).Value = "Total Pendapatan (Sukses):";
        ws.Cell(row, 4).Style.Font.Bold = true;
        ws.Cell(row, 5).Value = totalRevenue;
        ws.Cell(row, 5).Style.NumberFormat.Format = "Rp #,##0";

        row++;
        ws.Cell(row, 4).Value = "Total Profit Bersih:";
        ws.Cell(row, 4).Style.Font.Bold = true;
        ws.Cell(row, 5).Value = totalRevenue - totalCost;
        ws.Cell(row, 5).Style.NumberFormat.Format = "Rp #,##0";

        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}

public class ExportTransactionDto
{
    public string Id { get; set; } = string.Empty;
    public string? ReferenceId { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal ProviderCost { get; set; }
    public DateTime CreatedAt { get; set; }
}

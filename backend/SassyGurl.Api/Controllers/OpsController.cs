using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using SassyGurl.Api.Data;
using System.Diagnostics;
using System.Data;
using Npgsql;
using System.Data.Common;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SUPERADMIN")]
public class OpsController : ControllerBase
{
    private readonly SassyGurlDbContext _context;
    private readonly IConnectionMultiplexer _redis;
    private readonly IConfiguration _config;
    private readonly ILogger<OpsController> _logger;

    public OpsController(
        SassyGurlDbContext context, 
        IConnectionMultiplexer redis, 
        IConfiguration config,
        ILogger<OpsController> logger)
    {
        _context = context;
        _redis = redis;
        _config = config;
        _logger = logger;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var dbConnected = await _context.Database.CanConnectAsync();
        
        bool redisConnected = false;
        try 
        {
            redisConnected = _redis.IsConnected;
        } 
        catch 
        {
            redisConnected = false;
        }

        DateTime? lastBackup = GetLastBackupTimestamp();
        
        var lastSync = await _context.ProviderSyncLogs
            .Where(x => x.ErrorCount == 0)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => (DateTime?)x.CreatedAt)
            .FirstOrDefaultAsync();

        var allMetadata = await _context.Products
            .Where(p => p.Metadata != null)
            .Select(p => p.Metadata)
            .ToListAsync();
        var pendingReview = allMetadata.Count(m => m!.Contains("\"needsReview\":true"));
            
        var refundQueue = await _context.RefundQueues.CountAsync(r => !r.IsProcessed);
            
        var providerSummary = await _context.Providers
            .Select(p => new {
                Name = p.Name,
                Status = p.IsActive ? "OK" : "DOWN",
                LatencyMs = p.AvgLatencyMs
            })
            .ToListAsync();

        // Recent Notification Failures in the last 24h
        int notifFailures = 0;
        try 
        {
            await using var cmd = _context.Database.GetDbConnection().CreateCommand();
            cmd.CommandText = "SELECT COUNT(*) FROM \"SystemLogs\" WHERE level = 'Error' AND message_template LIKE '%Notification%failed%' AND timestamp >= NOW() - INTERVAL '1 day'";
            if (_context.Database.GetDbConnection().State != ConnectionState.Open)
                await _context.Database.OpenConnectionAsync();
            
            var result = await cmd.ExecuteScalarAsync();
            notifFailures = result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to query SystemLogs for notification failures");
            notifFailures = -1; // -1 represents unknown state
        }

        var uptime = TimeSpan.FromMilliseconds(Environment.TickCount64).ToString(@"dd\.hh\:mm\:ss");

        return Ok(new {
            success = true,
            data = new {
                databaseConnected = dbConnected,
                redisConnected = redisConnected,
                lastBackupTimestamp = lastBackup?.ToString("O") ?? "N/A",
                lastCatalogSync = lastSync?.ToString("O") ?? "N/A",
                pendingReviewQueueCount = pendingReview,
                refundQueueCount = refundQueue,
                recentNotificationFailures = notifFailures == -1 ? "N/A" : notifFailures.ToString(),
                systemUptime = uptime,
                providers = providerSummary
            }
        });
    }

    private DateTime? GetLastBackupTimestamp()
    {
        try
        {
            var backupDir = _config["BACKUP_DIR"] ?? "/backups";
            var dailyDir = Path.Combine(backupDir, "daily");
            
            if (!Directory.Exists(dailyDir))
            {
                // Fallback to checking the root backup dir if daily doesn't exist
                if (!Directory.Exists(backupDir)) return null;
                dailyDir = backupDir;
            }

            var files = Directory.GetFiles(dailyDir, "*.dump");
            if (files.Length == 0) return null;

            return files.Select(f => new FileInfo(f).LastWriteTimeUtc).Max();
        }
        catch
        {
            return null;
        }
    }
}

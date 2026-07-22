using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;

namespace SassyGurl.Api.Services;

public class LeaderboardResetService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<LeaderboardResetService> _logger;

    public LeaderboardResetService(IServiceProvider serviceProvider, ILogger<LeaderboardResetService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            
            // We want to run at the very beginning of the month (Day 1, 00:00 UTC)
            var nextRun = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);
            var delay = nextRun - now;

            _logger.LogInformation("LeaderboardResetService scheduling next run at {NextRun}", nextRun);

            try
            {
                await Task.Delay(delay, stoppingToken);

                // Run the job
                await ProcessLeaderboardRewardsAsync(stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during leaderboard reset processing.");
                // Retry in 1 hour if it fails
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }

    private async Task ProcessLeaderboardRewardsAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SassyGurlDbContext>();

        var now = DateTime.UtcNow;
        // The month that just ended
        var previousMonth = now.AddMonths(-1);
        var startOfPreviousMonth = new DateTime(previousMonth.Year, previousMonth.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfPreviousMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var top10 = await context.PointLedgers
            .Where(pl => pl.CreatedAt >= startOfPreviousMonth && pl.CreatedAt < endOfPreviousMonth && pl.Credit > 0)
            .GroupBy(pl => pl.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                MonthlyPoints = g.Sum(pl => pl.Credit)
            })
            .OrderByDescending(u => u.MonthlyPoints)
            .Take(10)
            .ToListAsync(stoppingToken);

        if (!top10.Any()) return;

        // Rewards logic (e.g., 10000 balance for top 1, 5000 for top 2, etc.)
        decimal[] rewards = { 100000, 50000, 25000, 10000, 10000, 5000, 5000, 5000, 5000, 5000 };

        for (int i = 0; i < top10.Count; i++)
        {
            var user = await context.Users.FindAsync(new object[] { top10[i].UserId }, stoppingToken);
            if (user != null)
            {
                var reward = rewards[i];
                user.Balance += reward;

                context.WalletLedgers.Add(new WalletLedger
                {
                    UserId = user.Id,
                    Credit = reward,
                    Debit = 0,
                    BalanceSnapshot = user.Balance,
                    Description = $"Leaderboard Top {i + 1} Reward ({previousMonth:MMMM yyyy})"
                });

                _logger.LogInformation("Rewarded Top {Rank} ({UserId}) with {Amount} balance.", i + 1, user.Id, reward);
            }
        }

        await context.SaveChangesAsync(stoppingToken);
    }
}

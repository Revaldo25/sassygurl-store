namespace SassyGurl.Application.Interfaces;

public interface ILoyaltyService
{
    Task<int> CalculateGachaBonusAsync(string transactionId);
    Task AwardPointsAfterSuccessAsync(string transactionId);
    Task<bool> SpendPointsAsync(string userId, int pointsToSpend, string description, string? transactionId = null);
    Task UpdateMemberTierAsync(string userId);
}

using SassyGurl.Domain.Entities;

namespace SassyGurl.Application.Interfaces;

/// <summary>
/// Service to perform manual 'Double-Check' (Pull-Verification) with the Payment Gateway
/// to ensure the webhook payload is authentic and not a spoofing attempt.
/// </summary>
public interface IPaymentValidationService
{
    /// <summary>
    /// Validates an invoice directly against the Payment Gateway API.
    /// Returns true if the invoice is genuinely paid and amounts match.
    /// If there is a mismatch, it logs a Potential_Fraud event in the Audit Trail.
    /// </summary>
    /// <param name="invoiceId">The invoice ID from the webhook payload.</param>
    /// <param name="expectedAmount">The expected amount to be paid.</param>
    /// <returns>True if valid, False if fraudulent or unpaid.</returns>
    Task<bool> ValidatePaymentAsync(string invoiceId, decimal expectedAmount);
}

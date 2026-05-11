using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using SassyGurl.Application.Interfaces;
using SassyGurl.Domain.Entities;

namespace SassyGurl.Infrastructure.Services;

/// <summary>
/// Implementation of Pull-Verification for Xendit.
/// Calls GET /v2/invoices/{id} to verify payment status and amount.
/// </summary>
public class XenditPaymentValidationService : IPaymentValidationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<XenditPaymentValidationService> _logger;

    public XenditPaymentValidationService(
        IHttpClientFactory httpClientFactory,
        ILogger<XenditPaymentValidationService> logger)
    {
        // Requires a named client "XenditClient" configured with Polly & Auth
        _httpClient = httpClientFactory.CreateClient("XenditClient");
        _logger = logger;
    }

    public async Task<bool> ValidatePaymentAsync(string invoiceId, decimal expectedAmount)
    {
        try
        {
            var response = await _httpClient.GetAsync($"v2/invoices/{invoiceId}");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to validate invoice {InvoiceId}. Status: {StatusCode}", invoiceId, response.StatusCode);
                return false;
            }

            var invoiceData = await response.Content.ReadFromJsonAsync<XenditInvoiceResponse>();
            if (invoiceData is null)
            {
                _logger.LogWarning("Failed to parse Xendit invoice {InvoiceId}", invoiceId);
                return false;
            }

            bool isStatusPaid = invoiceData.Status?.Equals("PAID", StringComparison.OrdinalIgnoreCase) == true ||
                                invoiceData.Status?.Equals("SETTLED", StringComparison.OrdinalIgnoreCase) == true;

            bool isAmountMatch = invoiceData.Amount == expectedAmount;

            if (isStatusPaid && isAmountMatch)
            {
                _logger.LogInformation("Invoice {InvoiceId} pull-verification successful.", invoiceId);
                return true;
            }

            // Potential Fraud Logging
            _logger.LogError(
                "POTENTIAL FRAUD DETECTED: Invoice {InvoiceId}. Expected Amount: {Expected}, Actual: {Actual}, Status: {Status}",
                invoiceId, expectedAmount, invoiceData.Amount, invoiceData.Status);

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred during Pull-Verification for invoice {InvoiceId}", invoiceId);
            return false;
        }
    }

    private class XenditInvoiceResponse
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }
    }
}

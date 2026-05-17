using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Filters;
using SassyGurl.Api.Models.Enums;
using SassyGurl.Api.Services;
using SassyGurl.Application.Interfaces;
using System.Text.Json.Serialization;

namespace SassyGurl.Api.Controllers;

// ============================================================================
// PAYMENT WEBHOOK CONTROLLER
// Receives callbacks from Xendit → Verifies → Triggers Provider → Notifies
// ============================================================================

[ApiController]
[Route("api/webhooks/xendit")]
public class XenditWebhookController : ControllerBase
{
    private readonly IPaymentValidationService _paymentValidation;
    private readonly IProviderService _providerService;
    private readonly INotificationOrchestrator _notifier;
    private readonly SassyGurlDbContext _db;
    private readonly ILogger<XenditWebhookController> _logger;

    public XenditWebhookController(
        IPaymentValidationService paymentValidation,
        IProviderService providerService,
        INotificationOrchestrator notifier,
        SassyGurlDbContext db,
        ILogger<XenditWebhookController> logger)
    {
        _paymentValidation = paymentValidation;
        _providerService = providerService;
        _notifier = notifier;
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/webhooks/xendit/invoice
    /// Secured by XenditWebhookAttribute (IP whitelist + x-callback-token).
    /// 
    /// Flow: Verify Signature → Pull-Verification → Update DB → 
    ///       Trigger Provider H2H → Notify WhatsApp + Telegram
    /// </summary>
    [HttpPost("invoice")]
    [XenditWebhook]
    public async Task<IActionResult> HandleInvoicePaid([FromBody] XenditInvoicePayload payload)
    {
        _logger.LogInformation("Received Xendit Webhook: InvoiceId={Id}, Status={Status}, Amount={Amount}",
            payload.Id, payload.Status, payload.Amount);

        // ── 1. Ignore non-paid statuses ─────────────────────────────────
        if (!string.Equals(payload.Status, "PAID", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(payload.Status, "SETTLED", StringComparison.OrdinalIgnoreCase))
        {
            return Ok(new { message = $"Ignored status: {payload.Status}" });
        }

        if (string.IsNullOrEmpty(payload.Id) || string.IsNullOrEmpty(payload.ExternalId))
        {
            return BadRequest(new { message = "Missing invoice or external ID." });
        }

        // ── 2. Pull-Verification (Reconciliation) ──────────────────────
        bool isVerified = await _paymentValidation.ValidatePaymentAsync(payload.Id, payload.Amount);
        if (!isVerified)
        {
            _logger.LogError("FRAUD ALERT: Invoice {Id} failed pull-verification.", payload.Id);
            return Ok(new { message = "Payload discarded (fraud check)." });
        }

        // ── 3. Find transaction by ExternalId (our InvoiceId) ──────────
        var transaction = await _db.Transactions
            .Include(t => t.Product)
            .Include(t => t.Game)
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.InvoiceId == payload.ExternalId);

        if (transaction == null)
        {
            _logger.LogWarning("Transaction not found for ExternalId {ExtId}", payload.ExternalId);
            return Ok(new { message = "Transaction not found." });
        }

        if (transaction.PaymentStatus == PaymentStatus.PAID)
        {
            _logger.LogInformation("Idempotency hit: Invoice {ExtId} is already PAID. Ignoring.", payload.ExternalId);
            return Ok(new { message = "Transaction already processed." });
        }

        // Update payment status
        transaction.PaymentStatus = PaymentStatus.PAID;
        transaction.PaidAt = DateTime.UtcNow;
        transaction.OrderStatus = OrderStatus.PROCESSING;

        await _db.SaveChangesAsync();

        // ── 4. Notify: Payment Received ────────────────────────────────
        var phone = transaction.Whatsapp ?? transaction.User?.Phone ?? "";
        var margin = transaction.PriceSell - transaction.PriceModal;

        await _notifier.NotifyPaymentReceivedAsync(new NotificationContext
        {
            Phone = phone,
            InvoiceId = transaction.InvoiceId,
            GameName = transaction.Game?.Name ?? "Unknown",
            ProductName = transaction.DenomName,
            Amount = transaction.TotalAmount,
            Margin = margin
        });

        // ── 5. Auto-trigger Provider H2H (VIP Reseller / Digiflazz) ───
        _logger.LogInformation("Triggering provider for {Invoice}, SKU={Sku}", transaction.InvoiceId, transaction.Sku);

        var providerResult = await _providerService.PlaceOrderAsync(
            sku: transaction.Sku,
            targetId: transaction.TargetId,
            zoneId: transaction.ZoneId ?? "",
            refId: transaction.Id);

        if (providerResult.IsSuccess)
        {
            transaction.OrderStatus = OrderStatus.SUCCESS;
            transaction.ProviderRef = providerResult.ProviderRef;
            transaction.Sn = providerResult.Sn;
            transaction.CompletedAt = DateTime.UtcNow;

            // Calculate profit
            transaction.Profit = margin;

            await _db.SaveChangesAsync();

            // ── 6. Notify: Order Success ────────────────────────────
            await _notifier.NotifyOrderSuccessAsync(new NotificationContext
            {
                Phone = phone,
                InvoiceId = transaction.InvoiceId,
                GameName = transaction.Game?.Name ?? "Unknown",
                ProductName = transaction.DenomName,
                Amount = transaction.TotalAmount,
                Margin = margin,
                Sn = providerResult.Sn,
                ProviderStatus = $"✅ {providerResult.ProviderName}"
            });

            _logger.LogInformation("Order {Invoice} fulfilled successfully via {Provider}.",
                transaction.InvoiceId, providerResult.ProviderName);
        }
        else
        {
            transaction.OrderStatus = OrderStatus.ERROR;
            await _db.SaveChangesAsync();

            // ── 6. Notify: Order Failed ─────────────────────────────
            await _notifier.NotifyOrderFailedAsync(new NotificationContext
            {
                Phone = phone,
                InvoiceId = transaction.InvoiceId,
                GameName = transaction.Game?.Name ?? "Unknown",
                ProductName = transaction.DenomName,
                Amount = transaction.TotalAmount,
                Margin = margin,
                ProviderStatus = providerResult.Message ?? "Provider Error"
            });

            _logger.LogError("Order {Invoice} FAILED at provider: {Msg}", transaction.InvoiceId, providerResult.Message);
        }

        return Ok(new { message = "Webhook processed." });
    }
}

// ── Xendit Invoice Payload DTO ─────────────────────────────────────────
public class XenditInvoicePayload
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("external_id")]
    public string? ExternalId { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}

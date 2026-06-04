using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Filters;
using SassyGurl.Api.Hubs;
using SassyGurl.Api.Middleware;
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
    private readonly IOrderTransitionHelper _transition;
    private readonly IOrderLockManager _lockManager;
    private readonly IHubContext<NotificationHub> _hub;

    public XenditWebhookController(
        IPaymentValidationService paymentValidation,
        IProviderService providerService,
        INotificationOrchestrator notifier,
        SassyGurlDbContext db,
        ILogger<XenditWebhookController> logger,
        IOrderTransitionHelper transition,
        IOrderLockManager lockManager,
        IHubContext<NotificationHub> hub)
    {
        _paymentValidation = paymentValidation;
        _providerService = providerService;
        _notifier = notifier;
        _db = db;
        _logger = logger;
        _transition = transition;
        _lockManager = lockManager;
        _hub = hub;
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
    [Idempotency]
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

        // ── 3. Acquire Lock & Find Transaction ─────────────────────────
        IDisposable? lockRelease = null;
        try
        {
            lockRelease = await _lockManager.AcquireLockAsync(payload.ExternalId, TimeSpan.FromSeconds(30));
        }
        catch (TimeoutException)
        {
            return StatusCode(503, new { message = "Service busy processing this invoice. Please retry." });
        }

        using (lockRelease)
        {
            var isRelational = _db.Database.IsRelational();
            var dbTransaction = isRelational ? await _db.Database.BeginTransactionAsync() : null;
            try
            {
            var transaction = await _db.Transactions
                .Include(t => t.Product)
                .Include(t => t.Game)
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.InvoiceId == payload.ExternalId);

            if (transaction == null)
            {
                _logger.LogWarning("Transaction not found for ExternalId {ExtId}", payload.ExternalId);
                if (dbTransaction != null) await dbTransaction.RollbackAsync();
                return Ok(new { message = "Transaction not found." });
            }

            if (transaction.PaymentStatus == PaymentStatus.PAID)
            {
                _logger.LogInformation("Idempotency hit: Invoice {ExtId} is already PAID. Ignoring.", payload.ExternalId);
                if (dbTransaction != null) await dbTransaction.RollbackAsync();
                return Ok(new { message = "Transaction already processed." });
            }

            // Update payment status
            transaction.PaymentStatus = PaymentStatus.PAID;
            transaction.PaidAt = DateTime.UtcNow;

            try
            {
                _transition.TransitionStatus(
                    _db,
                    transaction,
                    OrderStatus.PROCESSING,
                    "system",
                    reason: "Xendit payment settled");
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid state transition on Xendit settlement. OrderId={ExtId}", payload.ExternalId);
                if (dbTransaction != null) await dbTransaction.RollbackAsync();
                return Ok(new { message = "State transition invalid but webhook acknowledged." });
            }

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
                refId: transaction.Id,
                productId: transaction.ProductId);

            if (providerResult.IsSuccess)
            {
                try
                {
                    _transition.TransitionStatus(
                        _db,
                        transaction,
                        OrderStatus.SUCCESS,
                        "system",
                        reason: "Provider fulfillment success");
                }
                catch (InvalidOperationException ex)
                {
                    _logger.LogWarning(ex, "State transition to SUCCESS failed for {InvoiceId}. Order may remain in PROCESSING.", payload.ExternalId);
                }

                transaction.ProviderRef = providerResult.ProviderRef;
                transaction.Sn = providerResult.Sn;
                transaction.CompletedAt = DateTime.UtcNow;

                // Calculate profit
                transaction.Profit = margin;

                // ── DailyProfit Tracking (PA-03: parity with Midtrans) ────────
                var todayDate = DateTime.UtcNow.Date;
                var dailyProfit = await _db.DailyProfits
                    .FirstOrDefaultAsync(d => d.Date == todayDate);

                if (dailyProfit == null)
                {
                    dailyProfit = new Models.DailyProfit { Date = todayDate };
                    _db.DailyProfits.Add(dailyProfit);
                }

                dailyProfit.TotalRevenue += transaction.PriceSell;
                dailyProfit.TotalProviderCost += transaction.PriceModal;
                dailyProfit.NetProfit += margin;
                dailyProfit.OrderCount++;
                dailyProfit.SuccessCount++;

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
                try
                {
                    _transition.TransitionStatus(
                        _db,
                        transaction,
                        OrderStatus.FAILED,
                        "system",
                        reason: $"Provider error: {providerResult.Message}");
                }
                catch (InvalidOperationException ex)
                {
                    _logger.LogWarning(ex, "State transition to FAILED failed for {InvoiceId}. Order may remain in PROCESSING.", payload.ExternalId);
                }

                // ── T-05: Add RefundQueue on provider failure (parity with Midtrans) ──
                _db.RefundQueues.Add(new Models.RefundQueue
                {
                    TransactionId = transaction.Id,
                    Reason = $"Provider Error (Xendit flow): {providerResult.Message}",
                    IsProcessed = false
                });

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

                _logger.LogCritical("Order {Invoice} FAILED at provider. Added to RefundQueue. Reason: {Msg}", 
                    transaction.InvoiceId, providerResult.Message);
            }
            // ── 7. SignalR: Broadcast real-time update (parity with Midtrans) ──
            var broadcastPayload = new TransactionUpdatePayload(
                transaction.Id,
                transaction.InvoiceId,
                transaction.Game?.Name ?? "Unknown",
                transaction.Product?.Name ?? "Unknown",
                transaction.TargetId,
                transaction.TotalAmount,
                transaction.PaymentStatus.ToString(),
                transaction.OrderStatus.ToString(),
                transaction.ProviderRef,
                DateTime.UtcNow
            );

            await NotificationBroadcaster.BroadcastTransactionUpdate(_hub, broadcastPayload);

            if (!string.IsNullOrEmpty(transaction.UserId))
            {
                await NotificationBroadcaster.NotifyUserOrderUpdate(_hub, transaction.UserId, broadcastPayload);
            }

            if (dbTransaction != null) await dbTransaction.CommitAsync();
            return Ok(new { message = "Webhook processed." });
            }
            catch (Exception ex)
            {
                if (dbTransaction != null) await dbTransaction.RollbackAsync();
                _logger.LogError(ex, "Database transaction failed for Xendit webhook. InvoiceId={ExtId}", payload.ExternalId);
                throw;
            }
            finally
            {
                if (dbTransaction != null) await dbTransaction.DisposeAsync();
            }
        } // end lockRelease
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

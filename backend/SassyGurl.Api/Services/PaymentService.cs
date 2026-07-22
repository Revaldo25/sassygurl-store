using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;
using System.Text.Json;
using System.Threading;
using Microsoft.AspNetCore.SignalR;
using SassyGurl.Api.Hubs;
using SassyGurl.Application.Interfaces;

namespace SassyGurl.Api.Services;

public interface IPaymentService
{
    Task<ApiResponse<string>> ProcessMidtransWebhookAsync(JsonDocument payload, string sourceIp, bool skipSignatureValidation = false);
}

public class PaymentService : IPaymentService
{
    private readonly SassyGurlDbContext _context;
    private readonly ILogger<PaymentService> _logger;
    private readonly IMidtransWebhookSecurity _webhookSecurity;
    private readonly IProviderService _providerService;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly IWhatsAppService _whatsApp;
    private readonly IOrderTransitionHelper _transition;
    private readonly IOrderLockManager _lockManager;
    private readonly ILoyaltyService _loyaltyService;
    private readonly IAffiliateService _affiliateService;

    public PaymentService(
        SassyGurlDbContext context,
        ILogger<PaymentService> logger,
        IMidtransWebhookSecurity webhookSecurity,
        IProviderService providerService,
        IHubContext<NotificationHub> hub,
        IWhatsAppService whatsApp,
        IOrderTransitionHelper transition,
        IOrderLockManager lockManager,
        ILoyaltyService loyaltyService,
        IAffiliateService affiliateService)
    {
        _context = context;
        _logger = logger;
        _webhookSecurity = webhookSecurity;
        _providerService = providerService;
        _hub = hub;
        _whatsApp = whatsApp;
        _transition = transition;
        _lockManager = lockManager;
        _loyaltyService = loyaltyService;
        _affiliateService = affiliateService;
    }

    public async Task<ApiResponse<string>> ProcessMidtransWebhookAsync(JsonDocument payload, string sourceIp, bool skipSignatureValidation = false)
    {
        var root = payload.RootElement;

        if (!root.TryGetProperty("order_id", out var orderIdEl) ||
            !root.TryGetProperty("transaction_status", out var statusEl) ||
            !root.TryGetProperty("status_code", out var statusCodeEl) ||
            !root.TryGetProperty("gross_amount", out var grossAmountEl))
        {
            return ApiResponse<string>.Fail("Invalid webhook payload.");
        }

        var orderId = orderIdEl.GetString()!;
        var transactionStatus = statusEl.GetString()!;
        var statusCode = statusCodeEl.GetString() ?? string.Empty;
        var grossAmountRaw = grossAmountEl.GetString() ?? string.Empty;
        var signatureKey = root.TryGetProperty("signature_key", out var sigEl) ? sigEl.GetString() ?? string.Empty : string.Empty;
        var fraudStatus = root.TryGetProperty("fraud_status", out var fraudEl) 
            ? fraudEl.GetString() : null;

        if (!skipSignatureValidation && !_webhookSecurity.IsSignatureValid(orderId, statusCode, grossAmountRaw, signatureKey))
        {
            _logger.LogWarning("Rejected webhook due to invalid signature. OrderId={OrderId}, SourceIp={SourceIp}", orderId, sourceIp);
            return ApiResponse<string>.Fail("Invalid webhook signature.");
        }

        _logger.LogInformation(
            "Midtrans Webhook: OrderId={OrderId}, Status={Status}, Fraud={Fraud}, SourceIp={SourceIp}",
            orderId, transactionStatus, fraudStatus, sourceIp);

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.InvoiceId == orderId);

        if (transaction == null)
        {
            _logger.LogWarning("Webhook received for unknown order: {OrderId}", orderId);
            return ApiResponse<string>.Fail("Transaction not found.");
        }

        if (!_webhookSecurity.IsAmountValid(transaction.TotalAmount, grossAmountRaw))
        {
            _logger.LogWarning("Rejected webhook due to amount mismatch. OrderId={OrderId}, PayloadAmount={PayloadAmount}, ExpectedAmount={ExpectedAmount}",
                orderId, grossAmountRaw, transaction.TotalAmount);
            return ApiResponse<string>.Fail("Amount mismatch.");
        }

        // Basic replay defense: terminal state only accepts idempotent same-state updates.
        if (transaction.PaymentStatus is PaymentStatus.PAID or PaymentStatus.REFUNDED or PaymentStatus.CHARGEBACK or PaymentStatus.EXPIRED)
        {
            _logger.LogInformation("Ignoring duplicate webhook for terminal state. OrderId={OrderId}, CurrentPaymentStatus={PaymentStatus}",
                orderId, transaction.PaymentStatus);
            return ApiResponse<string>.Ok("OK", "Duplicate webhook ignored.");
        }

        // Store raw webhook data
        transaction.WebhookData = payload.RootElement.GetRawText();

        // Map Midtrans status to our enums
        IDisposable? lockRelease = null;
        try
        {
            lockRelease = await _lockManager.AcquireLockAsync(orderId, TimeSpan.FromSeconds(30));
        }
        catch (TimeoutException)
        {
            return ApiResponse<string>.Fail("Service busy. Midtrans should retry.");
        }
        
        using (lockRelease)
        {
            var isRelational = _context.Database.IsRelational();
            var dbTransaction = isRelational ? await _context.Database.BeginTransactionAsync() : null;
            try
            {
            // Re-fetch transaction inside lock to ensure latest state
            transaction = await _context.Transactions
                .Include(t => t.Product)
                .FirstOrDefaultAsync(t => t.InvoiceId == orderId);

            if (transaction!.PaymentStatus is PaymentStatus.PAID or PaymentStatus.REFUNDED or PaymentStatus.CHARGEBACK or PaymentStatus.EXPIRED)
            {
                return ApiResponse<string>.Ok("OK", "Duplicate webhook ignored (Checked in lock).");
            }

            switch (transactionStatus)
            {
                case "capture":
                case "settlement":
                    if (fraudStatus != "deny")
                    {
                        transaction.PaymentStatus = PaymentStatus.PAID;
                        transaction.PaidAt = DateTime.UtcNow;
                        
                        try
                        {
                            _transition.TransitionStatus(
                                _context,
                                transaction,
                                OrderStatus.PROCESSING,
                                "system",
                                reason: "Midtrans settlement webhook");
                        }
                        catch (InvalidOperationException ex)
                        {
                            _logger.LogWarning(ex, "Invalid state transition on Midtrans settlement. OrderId={OrderId}", orderId);
                            return ApiResponse<string>.Ok("OK", "State transition invalid but webhook acknowledged.");
                        }
                        
                        await _context.SaveChangesAsync(); // Save Payment status first

                        // WhatsApp: Notify "Pembayaran Diterima, Sedang Diproses"
                        _ = _whatsApp.SendPaymentReceivedAsync(
                            transaction.User?.Phone ?? "",
                            transaction.InvoiceId,
                            transaction.Game?.Name ?? "",
                            transaction.Product?.Name ?? "");
                        
                        // ── SYNCHRONOUS Provider Fulfillment ─────────────────────
                        if (transaction.Product?.Source == ProviderSource.MANUAL)
                        {
                            _logger.LogInformation("Order {OrderId} is MANUAL fulfillment. Leaving in PROCESSING state.", orderId);
                            // Notify Admin/Ops about new manual order if needed
                        }
                        else
                        {
                            try
                            {
                                var providerRes = await _providerService.PlaceOrderAsync(
                                    transaction.Product!.Sku, 
                                    transaction.TargetId, 
                                    transaction.ZoneId ?? "", 
                                    transaction.InvoiceId);

                                if (providerRes.IsSuccess)
                                {
                                    try
                                    {
                                        _transition.TransitionStatus(
                                            _context,
                                            transaction,
                                            OrderStatus.SUCCESS,
                                            "system",
                                            reason: "Provider fulfillment success");
                                    }
                                    catch (InvalidOperationException ex)
                                    {
                                        _logger.LogWarning(ex, "State transition to SUCCESS failed for {OrderId}. Order may remain in PROCESSING.", orderId);
                                    }

                                    transaction.ProviderRef = providerRes.ProviderRef;
                                    transaction.Sn = providerRes.Sn;
                                    transaction.CompletedAt = DateTime.UtcNow;

                                    // Loyalty points on success
                                    await _loyaltyService.AwardPointsAfterSuccessAsync(transaction.Id);

                                    // Affiliate Commission on success
                                    await _affiliateService.AwardCommissionAsync(transaction.Id);

                                    // ── Profit Tracking: Record to DailyProfits ──────
                                    var todayDate = DateTime.UtcNow.Date;
                                    var dailyProfit = await _context.DailyProfits
                                        .FirstOrDefaultAsync(d => d.Date == todayDate);

                                    if (dailyProfit == null)
                                    {
                                        dailyProfit = new DailyProfit { Date = todayDate };
                                        _context.DailyProfits.Add(dailyProfit);
                                    }

                                    dailyProfit.TotalRevenue += transaction.PriceSell;
                                    dailyProfit.TotalProviderCost += transaction.PriceModal;
                                    dailyProfit.NetProfit += (transaction.PriceSell - transaction.PriceModal);
                                    dailyProfit.OrderCount++;
                                    dailyProfit.SuccessCount++;

                                    // WhatsApp: Notify member of success
                                    _ = _whatsApp.SendOrderSuccessAsync(
                                        transaction.User?.Phone ?? "",
                                        transaction.InvoiceId,
                                        transaction.Game?.Name ?? "",
                                        transaction.Product?.Name ?? "",
                                        providerRes.Sn);
                                }
                                else if (providerRes.IsProviderDown)
                                {
                                    // FAILOVER BYPASS: Provider is down, keep order in PROCESSING state.
                                    _logger.LogWarning("CRITICAL: Provider is DOWN for {OrderId}. Order left in PROCESSING state for manual fulfillment.", orderId);
                                    
                                    _context.RefundQueues.Add(new RefundQueue
                                    {
                                        TransactionId = transaction.Id,
                                        Reason = $"Provider DOWN. Manual Top-Up Required: {providerRes.Message}",
                                        IsProcessed = false
                                    });
                                }
                                else
                                {
                                    try
                                    {
                                        _transition.TransitionStatus(
                                            _context,
                                            transaction,
                                            OrderStatus.FAILED,
                                            "system",
                                            reason: $"Provider error: {providerRes.Message}");
                                    }
                                    catch (InvalidOperationException ex)
                                    {
                                        _logger.LogWarning(ex, "State transition to FAILED failed for {OrderId}. Order may remain in PROCESSING.", orderId);
                                    }
                                    
                                    _context.RefundQueues.Add(new RefundQueue
                                    {
                                        TransactionId = transaction.Id,
                                        Reason = $"Provider Error: {providerRes.Message}",
                                        IsProcessed = false
                                    });
                                    
                                    _logger.LogCritical("Topup Failed for Paid Order {InvoiceId}. Added to RefundQueue. Reason: {Reason}", 
                                        transaction.InvoiceId, providerRes.Message);

                                    _ = _whatsApp.SendOrderFailedAsync(
                                        transaction.User?.Phone ?? "",
                                        transaction.InvoiceId,
                                        providerRes.Message ?? "Provider unavailable");
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Provider fulfillment failed for order {InvoiceId}. Order remains in PROCESSING state.", transaction.InvoiceId);
                            }
                        }

                        await _context.SaveChangesAsync();
                        await _hub.Clients.User(transaction.UserId).SendAsync("OrderStatusUpdated", new
                        {
                            InvoiceId = transaction.InvoiceId,
                            Status = transaction.OrderStatus.ToString()
                        });
                    }
                    break;

                case "pending":
                    transaction.PaymentStatus = PaymentStatus.UNPAID;
                    break;

                case "deny":
                    transaction.PaymentStatus = PaymentStatus.FAILED;
                    try { _transition.TransitionStatus(_context, transaction, OrderStatus.FAILED, "system", reason: "Midtrans deny"); }
                    catch (Exception ex) { _logger.LogWarning(ex, "State transition to FAILED failed for {OrderId}.", orderId); }
                    break;

                case "cancel":
                    transaction.PaymentStatus = PaymentStatus.FAILED; // Fallback since PaymentStatus has no Cancelled
                    try { _transition.TransitionStatus(_context, transaction, OrderStatus.CANCELLED, "system", reason: "Midtrans cancel"); }
                    catch (Exception ex) { _logger.LogWarning(ex, "State transition to CANCELLED failed for {OrderId}.", orderId); }
                    break;

                case "expire":
                    transaction.PaymentStatus = PaymentStatus.EXPIRED;
                    try { _transition.TransitionStatus(_context, transaction, OrderStatus.FAILED, "system", reason: "Midtrans expire"); }
                    catch (Exception ex) { _logger.LogWarning(ex, "State transition to FAILED failed for {OrderId}.", orderId); }
                    break;

                case "refund":
                    transaction.PaymentStatus = PaymentStatus.REFUNDED;
                    try { _transition.TransitionStatus(_context, transaction, OrderStatus.REFUNDING, "system", reason: "Midtrans refund"); }
                    catch (Exception ex) { _logger.LogWarning(ex, "State transition to REFUNDING failed for {OrderId}.", orderId); }
                    break;

                case "chargeback":
                    transaction.PaymentStatus = PaymentStatus.CHARGEBACK;
                    try { _transition.TransitionStatus(_context, transaction, OrderStatus.REFUNDING, "system", reason: "Midtrans chargeback"); }
                    catch (Exception ex) { _logger.LogWarning(ex, "State transition to REFUNDING (chargeback) failed for {OrderId}.", orderId); }
                    break;

                default:
                    _logger.LogInformation("Unhandled Midtrans status: {Status} for OrderId={OrderId}", transactionStatus, orderId);
                    return ApiResponse<string>.Ok("OK", "Status accepted without changes.");
            }

            await _context.SaveChangesAsync();

            // ── SignalR: Broadcast real-time update ──────────────────────
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

            // Notify all admin/owner dashboards
            await NotificationBroadcaster.BroadcastTransactionUpdate(_hub, broadcastPayload);

            // Notify the specific member who owns this transaction
            if (!string.IsNullOrEmpty(transaction.UserId))
            {
                await NotificationBroadcaster.NotifyUserOrderUpdate(_hub, transaction.UserId, broadcastPayload);
            }

            if (dbTransaction != null) await dbTransaction.CommitAsync();
            return ApiResponse<string>.Ok("OK", "Webhook processed successfully.");
            }
            catch (Exception ex)
            {
                if (dbTransaction != null) await dbTransaction.RollbackAsync();
                _logger.LogError(ex, "Database transaction failed for Midtrans webhook. OrderId={OrderId}", orderId);
                throw;
            }
            finally
            {
                if (dbTransaction != null) await dbTransaction.DisposeAsync();
            }
        }
    }
}

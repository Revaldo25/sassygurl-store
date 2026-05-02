using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;
using System.Text.Json;
using System.Threading;
using Microsoft.AspNetCore.SignalR;
using SassyGurl.Api.Hubs;

namespace SassyGurl.Api.Services;

public interface IPaymentService
{
    Task<ApiResponse<string>> ProcessMidtransWebhookAsync(JsonDocument payload, string sourceIp);
}

public class PaymentService : IPaymentService
{
    private readonly SassyGurlDbContext _context;
    private readonly ILogger<PaymentService> _logger;
    private readonly IMidtransWebhookSecurity _webhookSecurity;
    private readonly IProviderService _providerService;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly IWhatsAppService _whatsApp;
    private readonly IServiceScopeFactory _scopeFactory;
    private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public PaymentService(
        SassyGurlDbContext context,
        ILogger<PaymentService> logger,
        IMidtransWebhookSecurity webhookSecurity,
        IProviderService providerService,
        IHubContext<NotificationHub> hub,
        IWhatsAppService whatsApp,
        IServiceScopeFactory scopeFactory)
    {
        _context = context;
        _logger = logger;
        _webhookSecurity = webhookSecurity;
        _providerService = providerService;
        _hub = hub;
        _whatsApp = whatsApp;
        _scopeFactory = scopeFactory;
    }

    public async Task<ApiResponse<string>> ProcessMidtransWebhookAsync(JsonDocument payload, string sourceIp)
    {
        var root = payload.RootElement;

        if (!root.TryGetProperty("order_id", out var orderIdEl) ||
            !root.TryGetProperty("transaction_status", out var statusEl) ||
            !root.TryGetProperty("status_code", out var statusCodeEl) ||
            !root.TryGetProperty("gross_amount", out var grossAmountEl) ||
            !root.TryGetProperty("signature_key", out var signatureEl))
        {
            return ApiResponse<string>.Fail("Invalid webhook payload.");
        }

        var orderId = orderIdEl.GetString()!;
        var transactionStatus = statusEl.GetString()!;
        var statusCode = statusCodeEl.GetString() ?? string.Empty;
        var grossAmountRaw = grossAmountEl.GetString() ?? string.Empty;
        var signatureKey = signatureEl.GetString() ?? string.Empty;
        var fraudStatus = root.TryGetProperty("fraud_status", out var fraudEl) 
            ? fraudEl.GetString() : null;

        if (!_webhookSecurity.IsSignatureValid(orderId, statusCode, grossAmountRaw, signatureKey))
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
        await _semaphore.WaitAsync();
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
                        transaction.OrderStatus = OrderStatus.PROCESSING;
                        
                        await _context.SaveChangesAsync(); // Save Payment status first

                        // WhatsApp: Notify "Pembayaran Diterima, Sedang Diproses"
                        _ = _whatsApp.SendPaymentReceivedAsync(
                            transaction.User?.Phone ?? "",
                            transaction.InvoiceId,
                            transaction.Game?.Name ?? "",
                            transaction.Product?.Name ?? "");
                        
                        // Fire to Provider as Fire-and-Forget
                        var transactionId = transaction.Id;
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                using var scope = _scopeFactory.CreateScope();
                                var dbContext = scope.ServiceProvider.GetRequiredService<SassyGurlDbContext>();
                                var providerSvc = scope.ServiceProvider.GetRequiredService<IProviderService>();
                                var whatsappSvc = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();
                                var hubCtx = scope.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();
                                var logger = scope.ServiceProvider.GetRequiredService<ILogger<PaymentService>>();

                                var tx = await dbContext.Transactions
                                    .Include(t => t.User)
                                    .Include(t => t.Game)
                                    .Include(t => t.Product)
                                    .FirstOrDefaultAsync(t => t.Id == transactionId);
                                    
                                if (tx == null) return;

                                var providerRes = await providerSvc.PlaceOrderAsync(
                                    tx.Product.Sku, 
                                    tx.TargetId, 
                                    tx.ZoneId ?? "", 
                                    tx.InvoiceId);

                                if (providerRes.IsSuccess)
                                {
                                    tx.OrderStatus = OrderStatus.SUCCESS;
                                    tx.ProviderRef = providerRes.ProviderRef;
                                    tx.Sn = providerRes.Sn;

                                    // ── Profit Tracking: Record to DailyProfits ──────
                                    var todayDate = DateTime.UtcNow.Date;
                                    var dailyProfit = await dbContext.DailyProfits
                                        .FirstOrDefaultAsync(d => d.Date == todayDate);

                                    if (dailyProfit == null)
                                    {
                                        dailyProfit = new DailyProfit { Date = todayDate };
                                        dbContext.DailyProfits.Add(dailyProfit);
                                    }

                                    dailyProfit.TotalRevenue += tx.PriceSell;
                                    dailyProfit.TotalProviderCost += tx.PriceModal;
                                    dailyProfit.NetProfit += (tx.PriceSell - tx.PriceModal);
                                    dailyProfit.OrderCount++;
                                    dailyProfit.SuccessCount++;

                                    // WhatsApp: Notify member of success
                                    _ = whatsappSvc.SendOrderSuccessAsync(
                                        tx.User?.Phone ?? "",
                                        tx.InvoiceId,
                                        tx.Game?.Name ?? "",
                                        tx.Product?.Name ?? "",
                                        providerRes.Sn);
                                }
                                else
                                {
                                    tx.OrderStatus = OrderStatus.ERROR;
                                    
                                    // Add to RefundQueue because Paid but Failed to topup
                                    dbContext.RefundQueues.Add(new RefundQueue
                                    {
                                        TransactionId = tx.Id,
                                        Reason = $"Provider Error: {providerRes.Message}",
                                        IsProcessed = false
                                    });
                                    
                                    logger.LogCritical("Topup Failed for Paid Order {InvoiceId}. Added to RefundQueue. Reason: {Reason}", tx.InvoiceId, providerRes.Message);

                                    // WhatsApp: Notify member of issue
                                    _ = whatsappSvc.SendOrderFailedAsync(
                                        tx.User?.Phone ?? "",
                                        tx.InvoiceId,
                                        providerRes.Message ?? "Provider unavailable");
                                }

                                await dbContext.SaveChangesAsync();

                                // SignalR Update
                                var payload = new TransactionUpdatePayload(
                                    tx.Id,
                                    tx.InvoiceId,
                                    tx.Game?.Name ?? "Unknown",
                                    tx.Product?.Name ?? "Unknown",
                                    tx.TargetId,
                                    tx.TotalAmount,
                                    tx.PaymentStatus.ToString(),
                                    tx.OrderStatus.ToString(),
                                    tx.ProviderRef,
                                    DateTime.UtcNow
                                );
                                await NotificationBroadcaster.BroadcastTransactionUpdate(hubCtx, payload);
                                if (!string.IsNullOrEmpty(tx.UserId))
                                {
                                    await NotificationBroadcaster.NotifyUserOrderUpdate(hubCtx, tx.UserId, payload);
                                }
                            }
                            catch (Exception ex)
                            {
                                // Log unexpected errors from background task
                            }
                        });
                    }
                    break;

                case "pending":
                    transaction.PaymentStatus = PaymentStatus.UNPAID;
                    break;

                case "deny":
                case "cancel":
                case "expire":
                    transaction.PaymentStatus = PaymentStatus.EXPIRED;
                    transaction.OrderStatus = OrderStatus.ERROR;
                    break;

                case "refund":
                    transaction.PaymentStatus = PaymentStatus.REFUNDED;
                    transaction.OrderStatus = OrderStatus.REFUNDING;
                    break;

                case "chargeback":
                    transaction.PaymentStatus = PaymentStatus.CHARGEBACK;
                    transaction.OrderStatus = OrderStatus.REFUNDING;
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

            return ApiResponse<string>.Ok("OK", "Webhook processed successfully.");
        }
        finally
        {
            _semaphore.Release();
        }
    }
}

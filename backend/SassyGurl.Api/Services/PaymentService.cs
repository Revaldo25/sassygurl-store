using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models.Enums;
using System.Text.Json;

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

    public PaymentService(
        SassyGurlDbContext context,
        ILogger<PaymentService> logger,
        IMidtransWebhookSecurity webhookSecurity)
    {
        _context = context;
        _logger = logger;
        _webhookSecurity = webhookSecurity;
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
        switch (transactionStatus)
        {
            case "capture":
            case "settlement":
                if (fraudStatus != "deny")
                {
                    transaction.PaymentStatus = PaymentStatus.PAID;
                    transaction.PaidAt = DateTime.UtcNow;
                    transaction.OrderStatus = OrderStatus.PROCESSING;
                    // TODO: Trigger provider fulfillment (Digiflazz/VIP Reseller)
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

        return ApiResponse<string>.Ok("OK", "Webhook processed successfully.");
    }
}

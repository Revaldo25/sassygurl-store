using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SassyGurl.Api.Controllers;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;
using SassyGurl.Api.Services;
using SassyGurl.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Microsoft.AspNetCore.Mvc;

namespace SassyGurl.Tests;

public class ProviderIntegrationTests : TestBase
{
    private readonly XenditWebhookController _xenditController;

    public ProviderIntegrationTests()
    {
        var mockValidation = new Mock<IPaymentValidationService>();
        mockValidation.Setup(v => v.ValidatePaymentAsync(It.IsAny<string>(), It.IsAny<decimal>())).ReturnsAsync(true);
        var mockNotifier = new Mock<INotificationOrchestrator>();

        _xenditController = new XenditWebhookController(
            mockValidation.Object,
            MockProviderService.Object,
            mockNotifier.Object,
            DbContext,
            new NullLogger<XenditWebhookController>(),
            TransitionHelper,
            LockManager
        );
    }

    [Fact]
    public async Task ProviderTimeout_Or_Error_AddsToRefundQueue_And_MarksFailed()
    {
        // Arrange
        var transaction = CreateTestTransaction();
        var payload = new XenditInvoicePayload
        {
            Id = "inv_456",
            ExternalId = transaction.InvoiceId,
            Status = "SETTLED",
            Amount = transaction.TotalAmount
        };

        // Simulate provider failing or timing out
        MockProviderService.Setup(p => p.PlaceOrderAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new ProviderOrderResponse { IsSuccess = false, Message = "Connection Timeout" });

        System.Console.WriteLine($"DB Count: {DbContext.Transactions.Count()}, ID in DB: {DbContext.Transactions.First().InvoiceId}, Payload ID: {payload.ExternalId}");

        var txWithInclude = Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
            DbContext.Transactions.Include(t => t.Product).Include(t => t.Game).Include(t => t.User),
            t => t.InvoiceId == payload.ExternalId).Result;
        System.Console.WriteLine($"DB Include Test: {(txWithInclude != null ? "FOUND" : "NULL")}");

        // Act
        var result = await _xenditController.HandleInvoicePaid(payload);
        var objectResult = Assert.IsType<OkObjectResult>(result);
        var msg = objectResult.Value.GetType().GetProperty("message")?.GetValue(objectResult.Value)?.ToString();
        System.Console.WriteLine($"WEBHOOK MESSAGE: {msg}");

        // Assert
        var dbTx = DbContext.Transactions.Find(transaction.Id);
        Assert.Equal(PaymentStatus.PAID, dbTx!.PaymentStatus);
        Assert.Equal(OrderStatus.FAILED, dbTx.OrderStatus);

        var refundQueue = DbContext.RefundQueues.FirstOrDefault(r => r.TransactionId == transaction.Id);
        Assert.NotNull(refundQueue);
        Assert.Contains("Connection Timeout", refundQueue.Reason);
        Assert.False(refundQueue.IsProcessed);
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SassyGurl.Api.Controllers;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Services;
using SassyGurl.Application.Interfaces;
using SassyGurl.Api.Models.Enums;
using System.Text.Json;
using Xunit;

namespace SassyGurl.Tests;

public class WebhookIntegrationTests : TestBase
{
    private readonly XenditWebhookController _xenditController;

    public WebhookIntegrationTests()
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
    public async Task Xendit_DuplicateCallback_IsIdempotent_And_ThreadSafe()
    {
        // Arrange
        var transaction = CreateTestTransaction();
        var payload = new XenditInvoicePayload
        {
            Id = "inv_123",
            ExternalId = transaction.InvoiceId,
            Status = "SETTLED",
            Amount = transaction.TotalAmount
        };

        MockProviderService.Setup(p => p.PlaceOrderAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new ProviderOrderResponse { IsSuccess = true, Sn = "123", ProviderRef = "abc" });

        // Act - Simulate 3 concurrent webhooks arriving at the exact same millisecond
        var tasks = new List<Task<IActionResult>>
        {
            _xenditController.HandleInvoicePaid(payload),
            _xenditController.HandleInvoicePaid(payload),
            _xenditController.HandleInvoicePaid(payload)
        };

        await Task.WhenAll(tasks);

        // Assert
        // Provider should only be called EXACTLY ONCE despite 3 concurrent requests
        MockProviderService.Verify(p => p.PlaceOrderAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);

        var dbTx = DbContext.Transactions.Find(transaction.Id);
        Assert.Equal(PaymentStatus.PAID, dbTx!.PaymentStatus);
        Assert.Equal(OrderStatus.SUCCESS, dbTx.OrderStatus);
    }
}

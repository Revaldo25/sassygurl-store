using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;
using SassyGurl.Api.Services;
using Xunit;

namespace SassyGurl.Tests;

public class TransactionStateTests : TestBase
{
    [Fact]
    public void StateMachine_InvalidTransition_ThrowsInvalidOperationException()
    {
        // Arrange
        var transaction = CreateTestTransaction(OrderStatus.SUCCESS, PaymentStatus.PAID);

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => 
        {
            TransitionHelper.TransitionStatus(
                DbContext, 
                transaction, 
                OrderStatus.CANCELLED, 
                "system", 
                "Attempt to cancel a successful order");
        });

        Assert.Contains("Invalid order status transition", ex.Message);
        
        // Ensure no history was written
        var historyCount = DbContext.OrderStatusHistories.Count(h => h.TransactionId == transaction.Id);
        Assert.Equal(0, historyCount);
    }

    [Fact]
    public void StateMachine_ValidTransition_WritesAuditHistory()
    {
        // Arrange
        var transaction = CreateTestTransaction(OrderStatus.PENDING, PaymentStatus.PAID);

        // Act
        TransitionHelper.TransitionStatus(
            DbContext, 
            transaction, 
            OrderStatus.PROCESSING, 
            "system", 
            "Processing initiated");

        DbContext.SaveChanges();

        // Assert
        Assert.Equal(OrderStatus.PROCESSING, transaction.OrderStatus);

        var history = DbContext.OrderStatusHistories.SingleOrDefault(h => h.TransactionId == transaction.Id);
        Assert.NotNull(history);
        Assert.Equal(OrderStatus.PENDING, history.FromStatus);
        Assert.Equal(OrderStatus.PROCESSING, history.ToStatus);
        Assert.Equal("system", history.ChangedBy);
        Assert.Equal("Processing initiated", history.Reason);
    }
}

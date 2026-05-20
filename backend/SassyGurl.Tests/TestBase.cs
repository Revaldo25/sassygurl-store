using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SassyGurl.Api.Data;
using SassyGurl.Api.Services;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;

namespace SassyGurl.Tests;

public abstract class TestBase : IDisposable
{
    protected SassyGurlDbContext DbContext { get; private set; }
    protected Mock<IProviderService> MockProviderService { get; private set; }
    protected IOrderTransitionHelper TransitionHelper { get; private set; }
    protected IOrderLockManager LockManager { get; private set; }

    protected TestBase()
    {
        var options = new DbContextOptionsBuilder<SassyGurlDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        DbContext = new SassyGurlDbContext(options);
        
        // Seed basic dependencies needed for state transitions
        var mockNotifier = new Mock<INotificationOrchestrator>();
        var stateMachine = new OrderStateMachine();
        TransitionHelper = new OrderTransitionHelper(
            stateMachine, 
            DbContext, 
            new NullLogger<OrderTransitionHelper>());
            
        LockManager = new OrderLockManager(new NullLogger<OrderLockManager>());
        MockProviderService = new Mock<IProviderService>();
    }

    protected Transaction CreateTestTransaction(OrderStatus status = OrderStatus.PENDING, PaymentStatus paymentStatus = PaymentStatus.UNPAID)
    {
        var category = new Category { Id = Guid.NewGuid().ToString(), Name = "Test Category", Slug = "test-category" };
        var game = new Game { Id = Guid.NewGuid().ToString(), Name = "Test Game", Slug = "test-game", IsActive = true, Publisher = "Test", CategoryId = category.Id };
        var product = new Product { Id = Guid.NewGuid().ToString(), Name = "Test Product", Sku = "TEST-SKU", GameId = game.Id, IsActive = true, ProviderId = "1" };
        var user = new User { Id = Guid.NewGuid().ToString(), Email = "test@test.com", Phone = "08123456789", Role = Role.MEMBER, CreatedAt = DateTime.UtcNow, Name = "test" };
        var paymentGroup = new PaymentMethod { Id = Guid.NewGuid().ToString(), Name = "Virtual Account", Code = "TEST-CODE", IsActive = true };
        
        DbContext.Categories.Add(category);
        DbContext.Games.Add(game);
        DbContext.Products.Add(product);
        DbContext.Users.Add(user);
        DbContext.PaymentMethods.Add(paymentGroup);

        var t = new Transaction
        {
            Id = Guid.NewGuid().ToString(),
            InvoiceId = "INV-TEST-" + Guid.NewGuid().ToString().Substring(0, 5),
            OrderStatus = status,
            PaymentStatus = paymentStatus,
            TotalAmount = 100000,
            CreatedAt = DateTime.UtcNow,
            Sku = "TEST-SKU",
            TargetId = "12345",
            PriceSell = 100000,
            PriceModal = 90000,
            DenomName = "Test Denom",
            GameId = game.Id,
            PaymentId = paymentGroup.Id,
            ProductId = product.Id,
            UserId = user.Id
        };
        try 
        {
            DbContext.Transactions.Add(t);
            DbContext.SaveChanges();
        }
        catch (Exception ex)
        {
            System.IO.File.WriteAllText("error.txt", ex.ToString());
            throw;
        }
        return t;
    }

    public void Dispose()
    {
        DbContext.Database.EnsureDeleted();
        DbContext.Dispose();
    }
}

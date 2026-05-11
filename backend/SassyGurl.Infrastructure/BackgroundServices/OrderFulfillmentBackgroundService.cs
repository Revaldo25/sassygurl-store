using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SassyGurl.Application.Interfaces;

namespace SassyGurl.Infrastructure.BackgroundServices;

/// <summary>
/// BackgroundService that consumes the OrderFulfillmentQueue.
/// Processes orders via Provider API with automatic retry policies (Polly handles the retry inside the API Client).
/// </summary>
public class OrderFulfillmentBackgroundService : BackgroundService
{
    private readonly IOrderFulfillmentQueue _queue;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OrderFulfillmentBackgroundService> _logger;

    public OrderFulfillmentBackgroundService(
        IOrderFulfillmentQueue queue,
        IServiceProvider serviceProvider,
        ILogger<OrderFulfillmentBackgroundService> logger)
    {
        _queue = queue;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Order Fulfillment Background Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var request = await _queue.DequeueOrderAsync(stoppingToken);

                // Create a new scope for scoped services like DbContext or Providers
                using var scope = _serviceProvider.CreateScope();
                var providers = scope.ServiceProvider.GetRequiredService<IEnumerable<IProviderApiService>>();
                
                // Note: In real app, you'd map ProviderId to the specific IProviderApiService
                // Here, we'll try Digiflazz as default, or select based on ProviderName
                var provider = providers.FirstOrDefault() 
                               ?? throw new InvalidOperationException("No Provider API Service registered.");

                _logger.LogInformation("Processing fulfillment for Order {OrderNumber} via {Provider}", request.OrderNumber, provider.ProviderName);

                var response = await provider.CreateOrderAsync(request.Sku, request.CustomerTarget, request.TransactionId);

                if (response.IsSuccess)
                {
                    _logger.LogInformation("Successfully fulfilled Order {OrderNumber}. Provider SN: {Sn}", request.OrderNumber, response.Sn);
                    // TODO: Update Transaction Status to 'Processing' or 'Fulfilled' in DB
                }
                else
                {
                    _logger.LogError("Failed to fulfill Order {OrderNumber}. Provider Response: {Note}", request.OrderNumber, response.Note);
                    // TODO: Update Transaction Status to 'Failed' in DB
                }
            }
            catch (OperationCanceledException)
            {
                // Prevent throwing if stoppingToken is triggered
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred processing the fulfillment queue.");
            }
        }
    }
}

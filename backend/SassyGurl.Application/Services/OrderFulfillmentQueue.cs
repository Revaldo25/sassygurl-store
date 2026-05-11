using System.Threading.Channels;

namespace SassyGurl.Application.Interfaces;

public class OrderFulfillmentRequest
{
    public string TransactionId { get; set; } = null!;
    public string OrderNumber { get; set; } = null!;
    public string Sku { get; set; } = null!;
    public string CustomerTarget { get; set; } = null!;
    public string ProviderId { get; set; } = null!;
}

/// <summary>
/// Queue system for order fulfillment to handle provider API calls asynchronously.
/// </summary>
public interface IOrderFulfillmentQueue
{
    ValueTask EnqueueOrderAsync(OrderFulfillmentRequest request, CancellationToken cancellationToken = default);
    ValueTask<OrderFulfillmentRequest> DequeueOrderAsync(CancellationToken cancellationToken);
}

public class OrderFulfillmentQueue : IOrderFulfillmentQueue
{
    private readonly Channel<OrderFulfillmentRequest> _queue;

    public OrderFulfillmentQueue()
    {
        // Bounded channel to prevent OutOfMemory if the consumer is slow
        var options = new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.Wait
        };
        _queue = Channel.CreateBounded<OrderFulfillmentRequest>(options);
    }

    public async ValueTask EnqueueOrderAsync(OrderFulfillmentRequest request, CancellationToken cancellationToken = default)
    {
        await _queue.Writer.WriteAsync(request, cancellationToken);
    }

    public async ValueTask<OrderFulfillmentRequest> DequeueOrderAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}

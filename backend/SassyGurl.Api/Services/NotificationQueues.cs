using System.Threading.Channels;

namespace SassyGurl.Api.Services;

public class WhatsAppMessageItem
{
    public string Phone { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public interface IWhatsAppNotificationQueue
{
    ValueTask EnqueueAsync(WhatsAppMessageItem item);
    ValueTask<WhatsAppMessageItem> DequeueAsync(CancellationToken cancellationToken);
}

public class WhatsAppNotificationQueue : IWhatsAppNotificationQueue
{
    private readonly Channel<WhatsAppMessageItem> _queue;

    public WhatsAppNotificationQueue()
    {
        // Unbounded channel since it's just strings and we don't expect millions per second
        var options = new UnboundedChannelOptions
        {
            SingleReader = true, // We only have one worker
            SingleWriter = false
        };
        _queue = Channel.CreateUnbounded<WhatsAppMessageItem>(options);
    }

    public async ValueTask EnqueueAsync(WhatsAppMessageItem item)
    {
        await _queue.Writer.WriteAsync(item);
    }

    public async ValueTask<WhatsAppMessageItem> DequeueAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}

public class EmailMessageItem
{
    public string ToEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
}

public interface IEmailNotificationQueue
{
    ValueTask EnqueueAsync(EmailMessageItem item);
    ValueTask<EmailMessageItem> DequeueAsync(CancellationToken cancellationToken);
}

public class EmailNotificationQueue : IEmailNotificationQueue
{
    private readonly Channel<EmailMessageItem> _queue;

    public EmailNotificationQueue()
    {
        var options = new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        };
        _queue = Channel.CreateUnbounded<EmailMessageItem>(options);
    }

    public async ValueTask EnqueueAsync(EmailMessageItem item)
    {
        await _queue.Writer.WriteAsync(item);
    }

    public async ValueTask<EmailMessageItem> DequeueAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}

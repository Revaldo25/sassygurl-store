using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace SassyGurl.Infrastructure.HttpHandlers;

/// <summary>
/// HttpMessageHandler that masks sensitive headers (like Authorization / API Keys)
/// before they are written to the logs.
/// </summary>
public class LogMaskingHandler : DelegatingHandler
{
    private readonly ILogger<LogMaskingHandler> _logger;
    private static readonly string[] SensitiveHeaders = { "Authorization", "x-api-key", "api-key" };

    public LogMaskingHandler(ILogger<LogMaskingHandler> logger)
    {
        _logger = logger;
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        // Mask sensitive headers in Request
        foreach (var header in SensitiveHeaders)
        {
            if (request.Headers.Contains(header))
            {
                var values = request.Headers.GetValues(header).ToList();
                request.Headers.Remove(header);
                
                var maskedValues = values.Select(MaskApiKey).ToList();
                request.Headers.Add(header, maskedValues);
            }
        }

        _logger.LogInformation("Sending external request to {Url}", request.RequestUri);

        var response = await base.SendAsync(request, cancellationToken);

        _logger.LogInformation("Received external response from {Url} with status {StatusCode}", request.RequestUri, response.StatusCode);

        return response;
    }

    private string MaskApiKey(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return value;

        // Basic masking: e.g., "xnd_prod_12345abcde..." -> "xnd_prod_***"
        var prefix = "xnd_prod_";
        if (value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return prefix + "***";
        }
        
        // General Auth header masking: "Bearer eyJhbG..." -> "Bearer ***"
        if (value.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
        {
            return "Basic ***";
        }
        if (value.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return "Bearer ***";
        }

        // Default masking: keep first 4 chars, mask rest
        if (value.Length > 8)
        {
            return value.Substring(0, 4) + "***" + value.Substring(value.Length - 4);
        }

        return "***";
    }
}

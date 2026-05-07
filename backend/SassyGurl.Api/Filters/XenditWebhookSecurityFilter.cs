using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SassyGurl.Api.Filters;

/// <summary>
/// Action Filter to secure Xendit Webhook endpoints.
/// 1. Validates the x-callback-token header against the configured token.
/// 2. Restricts access to official Xendit IP addresses.
/// </summary>
public class XenditWebhookSecurityFilter : IAsyncActionFilter
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<XenditWebhookSecurityFilter> _logger;
    private readonly string[] _allowedIps;

    public XenditWebhookSecurityFilter(IConfiguration configuration, ILogger<XenditWebhookSecurityFilter> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        // Load allowed IPs from configuration
        _allowedIps = _configuration.GetSection("WebhookSecurity:XenditIpWhitelist").Get<string[]>() 
                      ?? Array.Empty<string>();
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var request = context.HttpContext.Request;

        // ── 1. IP Whitelisting Validation ─────────────────────────────
        var enforceIpWhitelist = _configuration.GetValue<bool>("WebhookSecurity:EnforceIpWhitelist");
        if (enforceIpWhitelist)
        {
            var remoteIp = context.HttpContext.Connection.RemoteIpAddress?.ToString();
            
            // Basic matching (for a more robust solution, IPNetwork matching can be used)
            if (string.IsNullOrEmpty(remoteIp) || !_allowedIps.Contains(remoteIp))
            {
                _logger.LogWarning("Blocked Xendit webhook request from unauthorized IP: {IP}", remoteIp);
                context.Result = new ObjectResult(new { message = "Forbidden. Invalid IP." })
                {
                    StatusCode = (int)HttpStatusCode.Forbidden
                };
                return;
            }
        }

        // ── 2. Callback Token Validation ──────────────────────────────
        if (!request.Headers.TryGetValue("x-callback-token", out var callbackTokenValues))
        {
            _logger.LogWarning("Xendit webhook missing x-callback-token header.");
            context.Result = new ObjectResult(new { message = "Missing callback token." })
            {
                StatusCode = (int)HttpStatusCode.Forbidden
            };
            return;
        }

        var providedToken = callbackTokenValues.First()!.Trim();
        var expectedToken = _configuration["Xendit:WebhookToken"];

        if (string.IsNullOrWhiteSpace(expectedToken) || providedToken != expectedToken)
        {
            _logger.LogWarning("Invalid Xendit x-callback-token provided.");
            context.Result = new ObjectResult(new { message = "Invalid callback token." })
            {
                StatusCode = (int)HttpStatusCode.Forbidden
            };
            return;
        }

        // If validation passes, proceed to the action
        await next();
    }
}

/// <summary>
/// Attribute to apply the Xendit Webhook Security Filter to a controller or action.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class XenditWebhookAttribute : ServiceFilterAttribute
{
    public XenditWebhookAttribute() : base(typeof(XenditWebhookSecurityFilter))
    {
    }
}

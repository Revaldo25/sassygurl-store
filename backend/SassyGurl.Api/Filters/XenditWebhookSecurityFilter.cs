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
            
            if (string.IsNullOrEmpty(remoteIp) || !IsIpAllowed(remoteIp, _allowedIps))
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

    /// <summary>
    /// Check if an IP address falls within any of the CIDR ranges.
    /// Supports both IPv4 and IPv6 mapped addresses.
    /// </summary>
    private static bool IsIpAllowed(string ipStr, string[] cidrRanges)
    {
        if (!System.Net.IPAddress.TryParse(ipStr, out var ip))
            return false;

        if (ip.IsIPv4MappedToIPv6)
            ip = ip.MapToIPv4();

        foreach (var cidr in cidrRanges)
        {
            var parts = cidr.Split('/');
            if (!System.Net.IPAddress.TryParse(parts[0], out var networkIp))
                continue;

            var prefixLength = parts.Length > 1 ? int.Parse(parts[1]) : 32;
            var networkBytes = networkIp.GetAddressBytes();
            var ipBytes = ip.GetAddressBytes();

            if (networkBytes.Length != ipBytes.Length)
                continue;

            var totalBits = networkBytes.Length * 8;
            var bitsToCompare = Math.Min(prefixLength, totalBits);

            bool match = true;
            for (int i = 0; i < bitsToCompare / 8 && match; i++)
            {
                if (networkBytes[i] != ipBytes[i])
                    match = false;
            }

            var remainingBits = bitsToCompare % 8;
            if (match && remainingBits > 0)
            {
                var byteIdx = bitsToCompare / 8;
                var mask = (byte)(0xFF << (8 - remainingBits));
                if ((networkBytes[byteIdx] & mask) != (ipBytes[byteIdx] & mask))
                    match = false;
            }

            if (match) return true;
        }

        return false;
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

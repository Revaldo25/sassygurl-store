using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SassyGurl.Api.Services;
using System.Net;
using System.Text.Json;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(
        IPaymentService paymentService,
        IConfiguration configuration,
        ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Midtrans Payment Notification Webhook.
    /// Protected by: Rate Limiting + IP Whitelist + HMAC Signature Validation.
    /// </summary>
    [EnableRateLimiting("payment-webhook")]
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var sourceIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        // ── IP Whitelist Guard ───────────────────────────────────────────
        var enforceWhitelist = _configuration.GetValue<bool>("WebhookSecurity:EnforceIpWhitelist");
        if (enforceWhitelist)
        {
            var whitelistedCidrs = _configuration
                .GetSection("WebhookSecurity:MidtransIpWhitelist")
                .Get<string[]>() ?? [];

            if (!IsIpAllowed(sourceIp, whitelistedCidrs))
            {
                _logger.LogWarning("Webhook BLOCKED — unauthorized IP: {SourceIp}", sourceIp);
                return StatusCode(403, new { success = false, message = "IP not authorized." });
            }
        }

        using var doc = await JsonDocument.ParseAsync(Request.Body, cancellationToken: HttpContext.RequestAborted);
        var result = await _paymentService.ProcessMidtransWebhookAsync(doc, sourceIp);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Check if an IP address falls within any of the CIDR ranges.
    /// Supports both IPv4 and IPv6 mapped addresses.
    /// </summary>
    private static bool IsIpAllowed(string ipStr, string[] cidrRanges)
    {
        if (!IPAddress.TryParse(ipStr, out var ip))
            return false;

        // Handle IPv6-mapped IPv4 (e.g., ::ffff:103.208.23.100)
        if (ip.IsIPv4MappedToIPv6)
            ip = ip.MapToIPv4();

        foreach (var cidr in cidrRanges)
        {
            var parts = cidr.Split('/');
            if (!IPAddress.TryParse(parts[0], out var networkIp))
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

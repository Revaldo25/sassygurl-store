using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SassyGurl.Api.Services;
using System.Text.Json;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    /// <summary>
    /// Midtrans Payment Notification Webhook
    /// </summary>
    [EnableRateLimiting("payment-webhook")]
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        using var doc = await JsonDocument.ParseAsync(Request.Body, cancellationToken: HttpContext.RequestAborted);
        var sourceIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var result = await _paymentService.ProcessMidtransWebhookAsync(doc, sourceIp);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}

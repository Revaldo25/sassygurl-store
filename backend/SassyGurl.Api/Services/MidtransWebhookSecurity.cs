using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace SassyGurl.Api.Services;

public interface IMidtransWebhookSecurity
{
    bool IsSignatureValid(string orderId, string statusCode, string grossAmountRaw, string signatureKey);
    bool IsAmountValid(decimal expectedTotal, string grossAmountRaw);
}

public sealed class MidtransWebhookSecurity : IMidtransWebhookSecurity
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<MidtransWebhookSecurity> _logger;

    public MidtransWebhookSecurity(IConfiguration configuration, ILogger<MidtransWebhookSecurity> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsSignatureValid(string orderId, string statusCode, string grossAmountRaw, string signatureKey)
    {
        var serverKey = _configuration["Midtrans:ServerKey"];
        if (string.IsNullOrWhiteSpace(serverKey))
        {
            _logger.LogError("Midtrans:ServerKey is not configured.");
            return false;
        }

        var expected = ComputeSha512($"{orderId}{statusCode}{grossAmountRaw}{serverKey}");
        return string.Equals(expected, signatureKey, StringComparison.OrdinalIgnoreCase);
    }

    public bool IsAmountValid(decimal expectedTotal, string grossAmountRaw)
    {
        if (!decimal.TryParse(grossAmountRaw, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed))
        {
            return false;
        }

        return decimal.Round(parsed, 2) == decimal.Round(expectedTotal, 2);
    }

    private static string ComputeSha512(string input)
    {
        var bytes = SHA512.HashData(Encoding.UTF8.GetBytes(input));
        var sb = new StringBuilder(bytes.Length * 2);
        foreach (var b in bytes)
        {
            sb.Append(b.ToString("x2"));
        }
        return sb.ToString();
    }
}

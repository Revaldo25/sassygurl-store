using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SassyGurl.Api.Services;
using System.Security.Cryptography;
using System.Text;
using Xunit;

namespace SassyGurl.Api.Tests;

public class MidtransWebhookSecurityTests
{
    [Fact]
    public void IsSignatureValid_ReturnsTrue_WhenPayloadIsValid()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Midtrans:ServerKey"] = "secret-server-key"
            })
            .Build();

        var sut = new MidtransWebhookSecurity(config, NullLogger<MidtransWebhookSecurity>.Instance);
        var orderId = "INV-123";
        var statusCode = "200";
        var grossAmount = "15000.00";
        var signature = ComputeSha512($"{orderId}{statusCode}{grossAmount}secret-server-key");

        var isValid = sut.IsSignatureValid(orderId, statusCode, grossAmount, signature);

        Assert.True(isValid);
    }

    [Fact]
    public void IsAmountValid_ReturnsFalse_WhenAmountMismatch()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Midtrans:ServerKey"] = "secret-server-key"
            })
            .Build();

        var sut = new MidtransWebhookSecurity(config, NullLogger<MidtransWebhookSecurity>.Instance);

        var isValid = sut.IsAmountValid(15000.00m, "12000.00");

        Assert.False(isValid);
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

using System.Net.Http.Headers;
using Polly;
using Polly.Extensions.Http;

namespace SassyGurl.Api.Services;

public sealed class ProviderApiOptions
{
    public string DigiflazzBaseUrl { get; set; } = "https://api.digiflazz.com/v1/";
    public string DigiflazzApiKey { get; set; } = string.Empty;
    public string VipResellerBaseUrl { get; set; } = "https://vipreseller.co.id/api/";
    public string VipResellerApiKey { get; set; } = string.Empty;
}

public interface IDigiflazzClient
{
    Task<HttpResponseMessage> PostAsync(string relativePath, HttpContent content, CancellationToken cancellationToken = default);
}

public interface IVipResellerClient
{
    Task<HttpResponseMessage> PostAsync(string relativePath, HttpContent content, CancellationToken cancellationToken = default);
}

public sealed class DigiflazzClient : IDigiflazzClient
{
    private readonly HttpClient _httpClient;

    public DigiflazzClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public Task<HttpResponseMessage> PostAsync(string relativePath, HttpContent content, CancellationToken cancellationToken = default)
    {
        return _httpClient.PostAsync(relativePath, content, cancellationToken);
    }
}

public sealed class VipResellerClient : IVipResellerClient
{
    private readonly HttpClient _httpClient;

    public VipResellerClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public Task<HttpResponseMessage> PostAsync(string relativePath, HttpContent content, CancellationToken cancellationToken = default)
    {
        return _httpClient.PostAsync(relativePath, content, cancellationToken);
    }
}

public static class ProviderClientRegistration
{
    public static IServiceCollection AddProviderClients(this IServiceCollection services, IConfiguration configuration)
    {
        var options = configuration.GetSection("ProviderApis").Get<ProviderApiOptions>() ?? new ProviderApiOptions();

        IAsyncPolicy<HttpResponseMessage> resiliencePolicy = HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(msg => (int)msg.StatusCode == 429)
            .WaitAndRetryAsync([TimeSpan.FromMilliseconds(200), TimeSpan.FromMilliseconds(600), TimeSpan.FromMilliseconds(1200)]);

        services.AddHttpClient<IDigiflazzClient, DigiflazzClient>(client =>
        {
            client.BaseAddress = new Uri(options.DigiflazzBaseUrl);
            client.Timeout = TimeSpan.FromSeconds(8);
            if (!string.IsNullOrWhiteSpace(options.DigiflazzApiKey))
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", options.DigiflazzApiKey);
            }
        })
        .AddPolicyHandler(resiliencePolicy)
        .AddTransientHttpErrorPolicy(policy => policy.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));

        services.AddHttpClient<IVipResellerClient, VipResellerClient>(client =>
        {
            client.BaseAddress = new Uri(options.VipResellerBaseUrl);
            client.Timeout = TimeSpan.FromSeconds(8);
            if (!string.IsNullOrWhiteSpace(options.VipResellerApiKey))
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", options.VipResellerApiKey);
            }
        })
        .AddPolicyHandler(resiliencePolicy)
        .AddTransientHttpErrorPolicy(policy => policy.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));

        return services;
    }
}

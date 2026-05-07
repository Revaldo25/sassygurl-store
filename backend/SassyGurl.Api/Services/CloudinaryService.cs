using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace SassyGurl.Api.Services;

/// <summary>
/// Minimal Cloudinary integration for product image upload.
/// Uploads a placeholder/icon per game+sku and returns the secure URL.
/// </summary>
public interface ICloudinaryService
{
    Task<string?> UploadPlaceholderAsync(string gameName, string sku);
}

public class CloudinaryService : ICloudinaryService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<CloudinaryService> _logger;

    public CloudinaryService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<CloudinaryService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<string?> UploadPlaceholderAsync(string gameName, string sku)
    {
        var cloudName = _config["Cloudinary:CloudName"] ?? "SassyGurlStore";
        var apiKey = _config["Cloudinary:ApiKey"];
        var apiSecret = _config["Cloudinary:ApiSecret"];

        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
        {
            _logger.LogDebug("Cloudinary credentials not configured. Using placeholder URL.");
            // Return a deterministic placeholder URL using UI Avatars
            var encodedName = Uri.EscapeDataString(gameName);
            return $"https://ui-avatars.com/api/?name={encodedName}&background=random&size=256&bold=true";
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var folder = "sassygurl/products";
            var publicId = $"{folder}/{gameName.ToLower().Replace(" ", "-")}_{sku}";

            // Build the signature string
            var toSign = $"folder={folder}&public_id={publicId}&timestamp={timestamp}{apiSecret}";
            using var sha1 = System.Security.Cryptography.SHA1.Create();
            var signatureBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(toSign));
            var signature = Convert.ToHexString(signatureBytes).ToLowerInvariant();

            // Use a generated placeholder via UI Avatars as the image source
            var imageUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(gameName)}&background=random&size=256&bold=true";

            var form = new MultipartFormDataContent
            {
                { new StringContent(imageUrl), "file" },
                { new StringContent(apiKey), "api_key" },
                { new StringContent(timestamp), "timestamp" },
                { new StringContent(signature), "signature" },
                { new StringContent(publicId), "public_id" },
                { new StringContent(folder), "folder" }
            };

            var response = await client.PostAsync($"https://api.cloudinary.com/v1_1/{cloudName}/image/upload", form);
            
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadFromJsonAsync<JsonElement>();
                return json.GetProperty("secure_url").GetString();
            }

            _logger.LogWarning("Cloudinary upload returned {StatusCode}", response.StatusCode);
            return $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(gameName)}&background=random&size=256&bold=true";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cloudinary upload failed for {Game}/{Sku}.", gameName, sku);
            return $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(gameName)}&background=random&size=256&bold=true";
        }
    }
}

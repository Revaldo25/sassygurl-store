using System.Text;
using System.Text.Json;
using SassyGurl.Domain.Entities;

namespace SassyGurl.Api.Services;

public interface IAiSupportService
{
    Task<string> GetReplyAsync(string channel, string senderId, string messageText, List<ChatMessage>? history = null);
}

public class AiSupportService : IAiSupportService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<AiSupportService> _logger;

    public AiSupportService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<AiSupportService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<string> GetReplyAsync(string channel, string senderId, string messageText, List<ChatMessage>? history = null)
    {
        var apiKey = _config["Gemini:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Gemini API Key is missing. Falling back to default message.");
            return "Maaf kak, saat ini SassyBot sedang tidur (API Key belum di-setting). Hubungi CS Manusia ya! 🥺";
        }

        var systemInstruction = @"Anda adalah SassyBot, asisten virtual ramah dan gaul dari SassyGurl Store.
SassyGurl Store melayani top-up game seperti Genshin Impact, ZZZ, MLBB, dan lainnya dengan proses kilat 1-3 detik.
Gunakan bahasa gaul, santai, namun profesional (seperti menggunakan sapaan 'Kak'). Gunakan emoji yang relevan.
Jangan bertele-tele. Jawab secara langsung.";

        var contents = new List<object>();

        // Build history context
        if (history != null && history.Any())
        {
            string currentRole = null;
            var currentParts = new List<object>();

            foreach (var msg in history.OrderBy(m => m.Timestamp).TakeLast(10)) // Take last 10 messages
            {
                var role = msg.SenderRole == "Customer" ? "user" : "model";
                
                // Gemini Strict Rule: First message MUST be from "user"
                if (contents.Count == 0 && currentRole == null && role == "model")
                {
                    continue; // Skip leading model messages
                }

                if (currentRole == role)
                {
                    // Consecutive message from the same role, add to parts
                    currentParts.Add(new { text = msg.MessageText });
                }
                else
                {
                    // New role, push previous and start new
                    if (currentRole != null)
                    {
                        contents.Add(new { role = currentRole, parts = currentParts.ToArray() });
                    }
                    currentRole = role;
                    currentParts = new List<object> { new { text = msg.MessageText } };
                }
            }
            
            // Push the last one
            if (currentRole != null)
            {
                contents.Add(new { role = currentRole, parts = currentParts.ToArray() });
            }
        }
        else
        {
            // First message
            contents.Add(new
            {
                role = "user",
                parts = new[] { new { text = messageText } }
            });
        }

        // Prepare request body for Gemini 1.5 Flash
        var requestBody = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemInstruction } }
            },
            contents = contents,
            generationConfig = new
            {
                temperature = 0.7,
                maxOutputTokens = 800
            }
        };

        var jsonBody = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

        using var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(8); // Set to 8 seconds to allow retries without making user wait too long
        
        var modelsToTry = new[] { "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro" };
        
        foreach (var model in modelsToTry)
        {
            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
                var response = await client.PostAsync(url, content);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseBody = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseBody);
                    
                    var replyText = doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString();

                    return replyText ?? "Maaf kak, SassyBot bingung mau jawab apa 🤔";
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning($"Gemini API Error with {model}: {{Error}}", error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Failed to connect to Gemini API using {model}");
            }
        }
        
        // If all models in the fallback loop failed or timed out
        return "Maaf kak, koneksi SassyBot lagi putus nyambung nih. 📡";
    }
}

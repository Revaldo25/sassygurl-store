using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace SassyGurl.Api.Controllers;

// ============================================================================
// GAME VALIDATION — "Cek Nickname" via VIP Reseller game-feature API
// ============================================================================

[ApiController]
[Route("api/game")]
public class GameValidationController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<GameValidationController> _logger;

    public GameValidationController(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<GameValidationController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/game/validate
    /// Validates a player's target ID (and optionally zone ID) via VIP Reseller.
    /// Returns the player's nickname for user confirmation before checkout.
    /// </summary>
    [HttpPost("validate")]
    public async Task<IActionResult> ValidateNickname([FromBody] ValidateNicknameRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.GameCode) || string.IsNullOrWhiteSpace(request.TargetId))
        {
            return BadRequest(new { success = false, message = "GameCode and TargetId are required." });
        }

        var apiKey = _config["VipReseller:ApiKey"];
        var apiId = _config["VipReseller:ApiId"];

        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiId))
        {
            return StatusCode(503, new { success = false, message = "Provider credentials not configured." });
        }

        try
        {
            var sign = CreateMD5($"{apiId}{apiKey}");
            var client = _httpClientFactory.CreateClient("VipResellerClient");

            // Map frontend game slug to VIP Reseller game code
            string vipGameCode = request.GameCode.ToLowerInvariant() switch
            {
                "mlbb" => "mobile-legends",
                "ff" => "free-fire",
                "genshin" => "genshin-impact",
                "hsr" => "honkai-star-rail",
                "zzz" => "zenless-zone-zero",
                "wuwa" => "wuthering-waves",
                "pubg" => "pubg-mobile",
                "valorant" => "valorant",
                "hok" => "honor-of-kings",
                "nikke" => "goddess-of-victory-nikke",
                "lol" => "league-of-legends",
                "wr" => "league-of-legends-wild-rift",
                "roblox" => "roblox",
                "aether" => "aether-gazer",
                "mccg" => "magic-chess",
                _ => request.GameCode
            };

            var formFields = new List<KeyValuePair<string, string>>
            {
                new("key", apiKey),
                new("sign", sign),
                new("type", "game-feature"),
                new("code", vipGameCode),
                new("target", request.TargetId)
            };

            // For games like Mobile Legends that require Zone/Server ID
            if (!string.IsNullOrWhiteSpace(request.ZoneId))
            {
                formFields.Add(new("additional_target", request.ZoneId));
            }

            var content = new FormUrlEncodedContent(formFields);
            var response = await client.PostAsync("game-feature", content);
            var responseStr = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("VIP Reseller validate response for {Game}/{Target}: {Response}",
                request.GameCode, request.TargetId, responseStr);

            var json = JsonSerializer.Deserialize<JsonElement>(responseStr);

            if (json.TryGetProperty("result", out var resultProp) && resultProp.GetBoolean())
            {
                string? nickname = null;
                if (json.TryGetProperty("data", out var data))
                {
                    // VIP Reseller returns nickname in various fields depending on the game
                    nickname = data.TryGetProperty("username", out var un) ? un.GetString() : null;
                    nickname ??= data.TryGetProperty("name", out var nm) ? nm.GetString() : null;
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        nickname = nickname ?? "Player",
                        targetId = request.TargetId,
                        zoneId = request.ZoneId
                    }
                });
            }

            var errorMsg = json.TryGetProperty("message", out var msg) ? msg.GetString() : "Nickname not found.";
            return Ok(new { success = false, message = errorMsg });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate nickname for {GameCode}/{TargetId}", request.GameCode, request.TargetId);
            return StatusCode(500, new { success = false, message = "Validation service temporarily unavailable." });
        }
    }

    private static string CreateMD5(string input)
    {
        using var md5 = MD5.Create();
        byte[] hash = md5.ComputeHash(Encoding.ASCII.GetBytes(input));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}

public class ValidateNicknameRequest
{
    /// <summary>VIP Reseller game code, e.g. "mobile-legends"</summary>
    public string GameCode { get; set; } = null!;

    /// <summary>Player's User/Target ID</summary>
    public string TargetId { get; set; } = null!;

    /// <summary>Zone/Server ID — required for games like Mobile Legends</summary>
    public string? ZoneId { get; set; }
}

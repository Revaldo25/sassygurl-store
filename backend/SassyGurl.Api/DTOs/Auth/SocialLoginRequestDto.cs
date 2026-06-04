using System.ComponentModel.DataAnnotations;

namespace SassyGurl.Api.DTOs.Auth;

public class SocialLoginRequestDto
{
    [Required]
    public string Provider { get; set; } = null!; // "google" or "facebook"

    [Required]
    public string ProviderAccountId { get; set; } = null!; // Google/Facebook ID

    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    public string? Name { get; set; }
}

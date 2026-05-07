using System.ComponentModel.DataAnnotations;

namespace SassyGurl.Api.DTOs.Auth;

public class LoginRequestDto
{
    [Required]
    public string Method { get; set; } = null!; // "email" or "phone"

    public string? Email { get; set; }
    public string? Phone { get; set; }

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = null!;
}

public class RegisterRequestDto
{
    [Required]
    public string Method { get; set; } = null!; // "email" or "phone"

    public string? Email { get; set; }
    public string? Phone { get; set; }

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = null!;

    public string? Name { get; set; }
}

public class VerifyOtpRequestDto
{
    [Required]
    public string Identifier { get; set; } = null!; // email or phone

    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string Otp { get; set; } = null!;
}

public class AuthResponseDto
{
    public string Token { get; set; } = null!;
    public string RefreshToken { get; set; } = null!;
    public string UserId { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Role { get; set; } = null!;
}

public class CurrentUserDto
{
    public string UserId { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Role { get; set; } = null!;
}

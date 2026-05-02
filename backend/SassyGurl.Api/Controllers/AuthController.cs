using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using SassyGurl.Api.DTOs.Auth;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Services;
using System.Security.Claims;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Invalid data"));

        var result = await _authService.LoginAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [EnableRateLimiting("auth")]
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<string>>> Register([FromBody] RegisterRequestDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Invalid data"));

        var result = await _authService.RegisterAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [EnableRateLimiting("auth")]
    [HttpPost("verify-otp")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> VerifyOtp([FromBody] VerifyOtpRequestDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Invalid data"));

        var result = await _authService.VerifyOtpAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult<ApiResponse<CurrentUserDto>> Me()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var name = User.FindFirst(ClaimTypes.Name)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized(ApiResponse<CurrentUserDto>.Fail("Unauthorized"));

        return Ok(ApiResponse<CurrentUserDto>.Ok(new CurrentUserDto
        {
            UserId = userId,
            Name = string.IsNullOrWhiteSpace(name) ? "Member" : name,
            Role = string.IsNullOrWhiteSpace(role) ? "MEMBER" : role
        }));
    }
}

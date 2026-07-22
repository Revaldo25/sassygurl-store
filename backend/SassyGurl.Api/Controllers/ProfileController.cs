using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Application.Services;
using System.Security.Claims;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly SassyGurlDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public ProfileController(SassyGurlDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<string>.Fail("No file uploaded."));
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse<string>.Fail("Unauthorized"));
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(ApiResponse<string>.Fail("User not found"));
        }

        try
        {
            using var stream = file.OpenReadStream();
            var url = await _fileStorage.UploadFileAsync(stream, file.FileName, "avatars");

            // Update user image
            user.Image = url;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<string>.Ok(url, "Avatar updated successfully."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail($"Failed to upload avatar: {ex.Message}"));
        }
    }
}

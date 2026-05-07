using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Auth;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SassyGurl.Api.Services;

public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request);
    Task<ApiResponse<string>> RegisterAsync(RegisterRequestDto request);
    Task<ApiResponse<AuthResponseDto>> VerifyOtpAsync(VerifyOtpRequestDto request);
}

public class AuthService : IAuthService
{
    private readonly SassyGurlDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;

    public AuthService(SassyGurlDbContext context, IConfiguration configuration, IHostEnvironment environment)
    {
        _context = context;
        _configuration = configuration;
        _environment = environment;
    }

    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email || u.Phone == request.Phone);

        if (user == null) return ApiResponse<AuthResponseDto>.Fail("Akun tidak ditemukan.");
        if (!user.IsVerified) return ApiResponse<AuthResponseDto>.Fail("Akun belum aktif! Silakan verifikasi OTP.");
        if (string.IsNullOrEmpty(user.Password)) return ApiResponse<AuthResponseDto>.Fail("Gunakan Login Google/Facebook.");

        bool isMatch = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);
        if (!isMatch) return ApiResponse<AuthResponseDto>.Fail("Password salah!");

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        // Save refresh token
        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == user.Id && a.Provider == "local") 
                      ?? new Account { Id = Guid.NewGuid().ToString(), UserId = user.Id, Type = "credentials", Provider = "local", ProviderAccountId = user.Id };

        account.RefreshToken = refreshToken;
        account.ExpiresAt = (int)DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeSeconds();
        
        if (!_context.Accounts.Local.Contains(account) && _context.Entry(account).State == EntityState.Detached) 
        {
            _context.Accounts.Add(account);
        }

        await _context.SaveChangesAsync();

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Name = user.Name ?? "Member",
            Role = user.Role.ToString()
        }, "Login Berhasil!");
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public async Task<ApiResponse<string>> RegisterAsync(RegisterRequestDto request)
    {
        var exist = await _context.Users
            .AnyAsync(u => (request.Email != null && u.Email == request.Email) || 
                           (request.Phone != null && u.Phone == request.Phone));

        if (exist) return ApiResponse<string>.Fail("Identitas sudah terdaftar!");

        var user = new User
        {
            Name = string.IsNullOrEmpty(request.Name) ? "Member VIP" : request.Name,
            Email = request.Email,
            Phone = request.Phone,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsVerified = false
        };

        _context.Users.Add(user);

        var otp = new Random().Next(100000, 999999).ToString();
        var token = new VerificationToken
        {
            Identifier = request.Method == "email" ? request.Email! : request.Phone!,
            Token = otp,
            Expires = DateTime.UtcNow.AddMinutes(10)
        };

        _context.VerificationTokens.Add(token);
        await _context.SaveChangesAsync();

        // TODO: Send Email/WA based on method (Omitted for dev)
        if (_environment.IsDevelopment())
        {
            Console.WriteLine($"[DEV ONLY] OTP for {token.Identifier}: {otp}");
        }

        return ApiResponse<string>.Ok(request.Method == "email" ? request.Email! : request.Phone!, $"OTP Terkirim! (Cek Console) -> {otp}");
    }

    public async Task<ApiResponse<AuthResponseDto>> VerifyOtpAsync(VerifyOtpRequestDto request)
    {
        var tokenRecord = await _context.VerificationTokens
            .FirstOrDefaultAsync(t => t.Identifier == request.Identifier && t.Token == request.Otp);

        if (tokenRecord == null) return ApiResponse<AuthResponseDto>.Fail("Kode OTP Salah atau tidak ditemukan!");
        if (DateTime.UtcNow > tokenRecord.Expires) return ApiResponse<AuthResponseDto>.Fail("Kode OTP sudah kedaluwarsa!");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Identifier || u.Phone == request.Identifier);

        if (user == null) return ApiResponse<AuthResponseDto>.Fail("User tidak ditemukan.");

        user.IsVerified = true;
        _context.VerificationTokens.RemoveRange(_context.VerificationTokens.Where(t => t.Identifier == request.Identifier));
        
        await _context.SaveChangesAsync();

        var jwt = GenerateJwtToken(user);

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = jwt,
            UserId = user.Id,
            Name = user.Name ?? "Member",
            Role = user.Role.ToString()
        }, "Verifikasi Berhasil!");
    }

    private string GenerateJwtToken(User user)
    {
        var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]!);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(ClaimTypes.Name, user.Name ?? "Member")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["Jwt:ExpireDays"])),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}

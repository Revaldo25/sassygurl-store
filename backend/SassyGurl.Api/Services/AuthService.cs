using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Auth;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SassyGurl.Api.Services;

public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request);
    Task<ApiResponse<string>> RegisterAsync(RegisterRequestDto request);
    Task<ApiResponse<AuthResponseDto>> VerifyOtpAsync(VerifyOtpRequestDto request);
    Task<ApiResponse<AuthResponseDto>> SocialLoginAsync(SocialLoginRequestDto request);
    Task<ApiResponse<string>> ForgotPasswordAsync(ForgotPasswordRequestDto request);
    Task<ApiResponse<string>> ResetPasswordAsync(ResetPasswordRequestDto request);
    Task<ApiResponse<AuthResponseDto>> UpdateProfileAsync(string userId, UpdateProfileRequestDto request);
    Task<ApiResponse<string>> ChangePasswordAsync(string userId, ChangePasswordRequestDto request);
}

public class AuthService : IAuthService
{
    private readonly SassyGurlDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AuthService> _logger;
    private readonly IWhatsAppNotificationQueue _waQueue;
    private readonly IEmailNotificationQueue _emailQueue;

    public AuthService(
        SassyGurlDbContext context,
        IConfiguration configuration,
        ILogger<AuthService> logger,
        IWebHostEnvironment environment,
        IWhatsAppNotificationQueue waQueue,
        IEmailNotificationQueue emailQueue)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _environment = environment;
        _waQueue = waQueue;
        _emailQueue = emailQueue;
    }

    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request)
    {
        var normalizedEmail = request.Email?.ToLower();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => 
                (!string.IsNullOrEmpty(normalizedEmail) && u.Email != null && u.Email.ToLower() == normalizedEmail) || 
                (!string.IsNullOrEmpty(request.Phone) && u.Phone == request.Phone));

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

    public async Task<ApiResponse<AuthResponseDto>> SocialLoginAsync(SocialLoginRequestDto request)
    {
        var normalizedEmail = request.Email?.ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email != null && normalizedEmail != null && u.Email.ToLower() == normalizedEmail);
        
        if (user == null)
        {
            user = new User
            {
                Name = string.IsNullOrWhiteSpace(request.Name) ? "Member" : request.Name,
                Email = request.Email,
                IsVerified = true,
                Role = Role.MEMBER
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == user.Id && a.Provider == request.Provider);
        if (account == null)
        {
            account = new Account
            {
                Id = Guid.NewGuid().ToString(),
                UserId = user.Id,
                Type = "oauth",
                Provider = request.Provider,
                ProviderAccountId = request.ProviderAccountId
            };
            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();
        }

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        account.RefreshToken = refreshToken;
        account.ExpiresAt = (int)DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeSeconds();
        await _context.SaveChangesAsync();

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Name = user.Name ?? "Member",
            Role = user.Role.ToString()
        }, "Social Login Berhasil!");
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
        var normalizedEmail = request.Email?.ToLower();
        var exist = await _context.Users
            .AnyAsync(u => (normalizedEmail != null && u.Email != null && u.Email.ToLower() == normalizedEmail) || 
                           (request.Phone != null && u.Phone == request.Phone));

        if (exist) return ApiResponse<string>.Fail("Identitas sudah terdaftar!");

        var user = new User
        {
            Name = string.IsNullOrEmpty(request.Name) ? "Member VIP" : request.Name,
            Email = normalizedEmail,
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

        if (request.Method == "email")
        {
            await _emailQueue.EnqueueAsync(new EmailMessageItem
            {
                ToEmail = request.Email!,
                Subject = "SassyGurl Store - Kode Verifikasi Anda",
                HtmlBody = $"<h2>Kode Verifikasi</h2><p>Kode OTP Anda adalah: <strong>{otp}</strong></p><p>Berlaku selama 10 menit.</p>"
            });
        }
        else
        {
            await _waQueue.EnqueueAsync(new WhatsAppMessageItem
            {
                Phone = request.Phone!,
                Message = $"🔒 *Kode Verifikasi SassyGurl*\n\nKode OTP Anda adalah: *{otp}*\n\nJangan bagikan kode ini kepada siapapun! Berlaku selama 10 menit."
            });
        }

        return ApiResponse<string>.Ok(request.Method == "email" ? request.Email! : request.Phone!, "OTP Terkirim! Silakan cek email/WhatsApp Anda.");
    }

    public async Task<ApiResponse<AuthResponseDto>> VerifyOtpAsync(VerifyOtpRequestDto request)
    {
        var tokenRecord = await _context.VerificationTokens
            .FirstOrDefaultAsync(t => t.Identifier == request.Identifier && t.Token == request.Otp);

        if (tokenRecord == null) return ApiResponse<AuthResponseDto>.Fail("Kode OTP Salah atau tidak ditemukan!");
        if (DateTime.UtcNow > tokenRecord.Expires) return ApiResponse<AuthResponseDto>.Fail("Kode OTP sudah kedaluwarsa!");

        var normalizedIdentifier = request.Identifier?.ToLower();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => (u.Email != null && normalizedIdentifier != null && u.Email.ToLower() == normalizedIdentifier) || u.Phone == request.Identifier);

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

    public async Task<ApiResponse<string>> ForgotPasswordAsync(ForgotPasswordRequestDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Identifier || u.Phone == request.Identifier);
        if (user == null) return ApiResponse<string>.Fail("Akun tidak ditemukan.");

        var otp = new Random().Next(100000, 999999).ToString();
        var token = new VerificationToken
        {
            Identifier = request.Identifier,
            Token = otp,
            Expires = DateTime.UtcNow.AddMinutes(10)
        };

        _context.VerificationTokens.Add(token);
        await _context.SaveChangesAsync();

        if (request.Identifier.Contains("@"))
        {
            await _emailQueue.EnqueueAsync(new EmailMessageItem
            {
                ToEmail = request.Identifier,
                Subject = "SassyGurl Store - Reset Password",
                HtmlBody = $"<h2>Reset Password</h2><p>Kode OTP reset password Anda adalah: <strong>{otp}</strong></p><p>Berlaku selama 10 menit.</p>"
            });
        }
        else
        {
            await _waQueue.EnqueueAsync(new WhatsAppMessageItem
            {
                Phone = request.Identifier,
                Message = $"🔒 *Reset Password SassyGurl*\n\nKode OTP Anda adalah: *{otp}*\n\nJangan bagikan kode ini kepada siapapun! Berlaku selama 10 menit."
            });
        }

        return ApiResponse<string>.Ok(request.Identifier, "Kode OTP telah dikirim!");
    }

    public async Task<ApiResponse<string>> ResetPasswordAsync(ResetPasswordRequestDto request)
    {
        var tokenRecord = await _context.VerificationTokens
            .FirstOrDefaultAsync(t => t.Identifier == request.Identifier && t.Token == request.Otp);

        if (tokenRecord == null) return ApiResponse<string>.Fail("Kode OTP Salah atau tidak ditemukan!");
        if (DateTime.UtcNow > tokenRecord.Expires) return ApiResponse<string>.Fail("Kode OTP sudah kedaluwarsa!");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Identifier || u.Phone == request.Identifier);
        if (user == null) return ApiResponse<string>.Fail("User tidak ditemukan.");

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        _context.VerificationTokens.RemoveRange(_context.VerificationTokens.Where(t => t.Identifier == request.Identifier));
        await _context.SaveChangesAsync();

        return ApiResponse<string>.Ok("OK", "Password berhasil direset! Silakan login dengan password baru.");
    }

    public async Task<ApiResponse<AuthResponseDto>> UpdateProfileAsync(string userId, UpdateProfileRequestDto request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return ApiResponse<AuthResponseDto>.Fail("Akun tidak ditemukan.");

        user.Name = request.Name;
        user.Phone = request.Whatsapp;
        
        await _context.SaveChangesAsync();
        
        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = GenerateJwtToken(user),
            RefreshToken = "",
            UserId = user.Id,
            Name = user.Name ?? "Member",
            Role = user.Role.ToString()
        }, "Profil berhasil diperbarui!");
    }

    public async Task<ApiResponse<string>> ChangePasswordAsync(string userId, ChangePasswordRequestDto request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return ApiResponse<string>.Fail("Akun tidak ditemukan.");

        if (string.IsNullOrEmpty(user.Password)) 
            return ApiResponse<string>.Fail("Akun ini terdaftar via Social Login. Anda tidak memiliki password.");

        bool isMatch = BCrypt.Net.BCrypt.Verify(request.OldPassword, user.Password);
        if (!isMatch) return ApiResponse<string>.Fail("Password saat ini salah.");

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return ApiResponse<string>.Ok("OK", "Password berhasil diubah.");
    }
}


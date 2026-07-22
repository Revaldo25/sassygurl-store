using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using SassyGurl.Application.Interfaces;

namespace SassyGurl.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body, string attachmentFileName = null, byte[] attachmentBytes = null)
    {
        try
        {
            var emailMessage = new MimeMessage();
            emailMessage.From.Add(new MailboxAddress("SassyGurl System", _configuration["Smtp:SenderEmail"] ?? "no-reply@sassygurl.id"));
            emailMessage.To.Add(new MailboxAddress("Owner", toEmail));
            emailMessage.Subject = subject;

            var builder = new BodyBuilder
            {
                HtmlBody = body
            };

            if (attachmentBytes != null && !string.IsNullOrEmpty(attachmentFileName))
            {
                builder.Attachments.Add(attachmentFileName, attachmentBytes);
            }

            emailMessage.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            
            // For development, you can use Mailtrap or Gmail SMTP
            var host = _configuration["Smtp:Host"] ?? "sandbox.smtp.mailtrap.io";
            var port = int.TryParse(_configuration["Smtp:Port"], out var p) ? p : 2525;
            var user = _configuration["Smtp:Username"] ?? "user";
            var pass = _configuration["Smtp:Password"] ?? "pass";

            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(user, pass);
            await client.SendAsync(emailMessage);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {ToEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail}", toEmail);
            throw;
        }
    }
}

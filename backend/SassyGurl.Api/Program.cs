using Microsoft.EntityFrameworkCore;
using Npgsql;
using Npgsql.NameTranslation;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models.Enums;
using System.Text.Json.Serialization;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using SassyGurl.Api.Middleware;
using SassyGurl.Api.Services;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection configuration.");
}

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException("Missing Jwt:Key configuration.");
}

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// CORS Policy — Allow Next.js Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("NextJsFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// In-process cache — short TTL entries auto-expire, no size limit needed
builder.Services.AddMemoryCache();

// Register DI Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<ITrackService, TrackService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IPromoService, PromoService>();
builder.Services.AddScoped<IMidtransWebhookSecurity, MidtransWebhookSecurity>();
builder.Services.AddProviderClients(builder.Configuration);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("auth", limiterOptions =>
    {
        limiterOptions.PermitLimit = 25;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
        limiterOptions.AutoReplenishment = true;
    });

    options.AddFixedWindowLimiter("payment-webhook", limiterOptions =>
    {
        limiterOptions.PermitLimit = 120;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
        limiterOptions.AutoReplenishment = true;
    });
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true
        };
    });

// Configure EF Core with PostgreSQL — Enum mapping via UseNpgsql options (Npgsql EF Core 9+ approach)
// Use identity translator since PostgreSQL labels are UPPERCASE matching C# enum names exactly
var noOpTranslator = new NoOpNameTranslator();
builder.Services.AddDbContext<SassyGurlDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.MapEnum<Role>("Role", nameTranslator: noOpTranslator);
        npgsqlOptions.MapEnum<KycStatus>("KycStatus", nameTranslator: noOpTranslator);
        npgsqlOptions.MapEnum<PaymentStatus>("PaymentStatus", nameTranslator: noOpTranslator);
        npgsqlOptions.MapEnum<OrderStatus>("OrderStatus", nameTranslator: noOpTranslator);
        npgsqlOptions.MapEnum<TicketStatus>("TicketStatus", nameTranslator: noOpTranslator);
        npgsqlOptions.MapEnum<TicketPriority>("TicketPriority", nameTranslator: noOpTranslator);
        npgsqlOptions.MapEnum<MutationType>("MutationType", nameTranslator: noOpTranslator);
        npgsqlOptions.MapEnum<PromoType>("PromoType", nameTranslator: noOpTranslator);
        npgsqlOptions.MapEnum<PaymentType>("PaymentType", nameTranslator: noOpTranslator);
    }));
builder.Services.AddHealthChecks()
    .AddDbContextCheck<SassyGurlDbContext>("postgres");

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseGlobalExceptionMiddleware();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS must be before routing/auth
app.UseCors("NextJsFrontend");

app.UseHttpsRedirection();
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

/// <summary>
/// Identity name translator — preserves C# enum member names as-is.
/// Required because PostgreSQL labels are UPPERCASE (MEMBER, QRIS, etc.) matching C# enum names.
/// </summary>
public class NoOpNameTranslator : INpgsqlNameTranslator
{
    public string TranslateTypeName(string clrName) => clrName;
    public string TranslateMemberName(string clrName) => clrName;
}

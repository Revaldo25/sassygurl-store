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
using SassyGurl.Api.Hubs;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.PostgreSQL;
using SassyGurl.Infrastructure;
using SassyGurl.Infrastructure.Interceptors;
using Microsoft.OpenApi;
using NpgsqlTypes;

// ============================================================================
// Serilog Bootstrap — captures startup/shutdown logs before DI is available
// ============================================================================
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting SassyGurl API...");

    var builder = WebApplication.CreateBuilder(args);

    // ========================================================================
    // Serilog Integration — replace built-in logging with Serilog
    // ========================================================================
    builder.Host.UseSerilog((context, services, configuration) =>
    {
        var connectionString = context.Configuration.GetConnectionString("DefaultConnection");

        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "SassyGurl.Api")
            .Enrich.WithProperty("Environment", context.HostingEnvironment.EnvironmentName)
            // Console sink — structured logs for development/container stdout
            .WriteTo.Console(
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
            // PostgreSQL sink — writes to "SystemLogs" table for production observability
            .WriteTo.PostgreSQL(
                connectionString: connectionString ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection for Serilog"),
                tableName: "SystemLogs",
                columnOptions: new Dictionary<string, ColumnWriterBase>
                {
                    { "message", new RenderedMessageColumnWriter(NpgsqlDbType.Text) },
                    { "message_template", new MessageTemplateColumnWriter(NpgsqlDbType.Text) },
                    { "level", new LevelColumnWriter(true, NpgsqlDbType.Varchar) },
                    { "timestamp", new TimestampColumnWriter(NpgsqlDbType.TimestampTz) },
                    { "exception", new ExceptionColumnWriter(NpgsqlDbType.Text) },
                    { "log_event", new LogEventSerializedColumnWriter(NpgsqlDbType.Jsonb) },
                    { "properties", new PropertiesColumnWriter(NpgsqlDbType.Jsonb) }
                },
                needAutoCreateTable: true, // Auto-create SystemLogs table on first write
                restrictedToMinimumLevel: LogEventLevel.Warning // Only persist Warning+ to database
            );
    });

    // ========================================================================
    // Configuration Validation
    // ========================================================================
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

    // ========================================================================
    // Core Services
    // ========================================================================
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

    // ── CORS Policy — Allow Next.js Frontend ────────────────────────────
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("NextJsFrontend", policy =>
        {
            policy.WithOrigins(
                    "http://localhost:3000",
                    "https://localhost:3000")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials(); // Required for SignalR WebSocket
        });
    });

    // SignalR for real-time dashboard updates
    builder.Services.AddSignalR();

    // In-process cache — short TTL entries auto-expire, no size limit needed
    builder.Services.AddMemoryCache();

    // ========================================================================
    // Infrastructure Layer DI (Redis, RedLock, Idempotency, Interceptors)
    // ========================================================================
    builder.Services.AddInfrastructure(builder.Configuration);

    // ========================================================================
    // Application Services DI
    // ========================================================================
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IDashboardService, DashboardService>();
    builder.Services.AddScoped<ITransactionService, TransactionService>();
    builder.Services.AddScoped<ICatalogService, CatalogService>();
    builder.Services.AddScoped<ITrackService, TrackService>();
    builder.Services.AddScoped<IPaymentService, PaymentService>();
    builder.Services.AddScoped<IPromoService, PromoService>();
    builder.Services.AddScoped<IMidtransWebhookSecurity, MidtransWebhookSecurity>();
    builder.Services.AddScoped<IProviderService, ProviderService>();
    builder.Services.AddScoped<IAuditService, AuditService>();
    builder.Services.AddScoped<IWhatsAppService, WhatsAppService>();
    builder.Services.AddScoped<ISettingsService, SettingsService>();
    builder.Services.AddHostedService<ProviderHealthMonitor>();

    // ── Core Engine Services ─────────────────────────────────────────────
    builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
    builder.Services.AddScoped<ISyncEngine, SyncEngine>();
    builder.Services.AddScoped<IProductService, ProductService>();
    builder.Services.AddScoped<ITelegramService, TelegramService>();
    builder.Services.AddScoped<INotificationOrchestrator, NotificationOrchestrator>();
    builder.Services.AddScoped<IVoucherService, VoucherService>();
    builder.Services.AddScoped<ICheckoutService, CheckoutService>();

    // ── Phase 3 Services ─────────────────────────────────────────────────
    builder.Services.AddScoped<SassyGurl.Api.Repositories.ICatalogRepository, SassyGurl.Api.Repositories.CatalogRepository>();

    // ── Phase 4: Smart Failover & Circuit Breaker (Polly) ───────────────
    // Contoh konfigurasi Polly Policy untuk Supply Chain Resilience:
    // Jika API VIP Reseller gagal (timeout/500/502) 3x berturut-turut, 
    // Circuit Breaker akan terbuka selama 15 menit. Request akan dialihkan (Fallback) 
    // ke Provider B (Digiflazz) atau memberikan HTTP 503 secara default.
    builder.Services.AddHttpClient("VipResellerClient", client =>
    {
        client.BaseAddress = new Uri(builder.Configuration["ProviderApis:VipResellerBaseUrl"] ?? "https://vipreseller.co.id/api/");
    })
    .AddStandardResilienceHandler(options =>
    {
        options.CircuitBreaker.FailureRatio = 0.5; // Jika >50% gagal dari window
        options.CircuitBreaker.MinimumThroughput = 3; // Minimal 3 request sebelum evaluasi
        options.CircuitBreaker.BreakDuration = TimeSpan.FromMinutes(15); // 'Pindah jalur' selama 15 menit
        options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(5);
    });

    builder.Services.AddHttpClient("DigiflazzClient", client =>
    {
        client.BaseAddress = new Uri(builder.Configuration["Digiflazz:BaseUrl"] ?? "https://api.digiflazz.com/v1/");
    })
    .AddStandardResilienceHandler(); // Standard retry + CB


    builder.Services.AddProviderClients(builder.Configuration);

    // ── Rate Limiting ────────────────────────────────────────────────────
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

    // ── JWT Authentication ───────────────────────────────────────────────
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
                ValidateLifetime = true,
                RoleClaimType = System.Security.Claims.ClaimTypes.Role,
                NameClaimType = System.Security.Claims.ClaimTypes.Name
            };
        });

    // ── EF Core with PostgreSQL ──────────────────────────────────────────
    // Enum mapping via UseNpgsql options (Npgsql EF Core 9+ approach)
    // Uses identity translator since PostgreSQL labels are UPPERCASE matching C# enum names
    var noOpTranslator = new NoOpNameTranslator();
    builder.Services.AddDbContext<SassyGurlDbContext>((serviceProvider, options) =>
    {
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
            npgsqlOptions.MapEnum<ProviderSource>("ProviderSource", nameTranslator: noOpTranslator);
        });

        // Register the TransactionAuditInterceptor for automatic audit trail
        var auditInterceptor = serviceProvider.GetRequiredService<TransactionAuditInterceptor>();
        options.AddInterceptors(auditInterceptor);
    });

    builder.Services.AddHealthChecks()
        .AddDbContextCheck<SassyGurlDbContext>("postgres");

    // ========================================================================
    // Swagger / OpenAPI Configuration
    // ========================================================================
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "SassyGurl Store API",
            Version = "v1",
            Description = "Enterprise-grade backend API for SassyGurl Game Top-Up Store. " +
                         "Features idempotency protection, automated audit trails, and comprehensive error handling.",
            Contact = new OpenApiContact
            {
                Name = "SassyGurl Engineering",
                Email = "engineering@sassygurl.store"
            }
        });

        // ── Security definition for JWT Bearer ──────────────────────────
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n " +
                          "Input ONLY your token in the text box below. (Swagger will add 'Bearer ' prefix automatically).",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT"
        });

        // ── Security definition for Idempotency Key ─────────────────────
        options.AddSecurityDefinition("IdempotencyKey", new OpenApiSecurityScheme
        {
            Name = "X-Idempotency-Key",
            Description = "UUID v4 idempotency key to prevent duplicate transactions. " +
                         "Required for all state-changing endpoints marked with [Idempotency].",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey
        });

        // Apply JWT security requirement globally
        options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
        });
    });

    // ========================================================================
    // Build & Configure Pipeline
    // ========================================================================
    var app = builder.Build();

    // ── Global Exception Handling (must be first in pipeline) ────────────
    app.UseExceptionMiddleware();

    // ── Serilog Request Logging ─────────────────────────────────────────
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000}ms";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value ?? "unknown");
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.ToString());
            diagnosticContext.Set("ClientIp", httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
        };
    });

    // ── Apply EF Core Migrations Automatically ────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        try
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<SassyGurlDbContext>();
            dbContext.Database.Migrate();
            Log.Information("Database migrations applied successfully.");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to apply database migrations.");
        }
    }

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "SassyGurl Store API v1");
            options.DocumentTitle = "SassyGurl API Documentation";
        });
    }

    // CORS must be before routing/auth
    app.UseCors("NextJsFrontend");

    app.UseHttpsRedirection();
    app.UseRateLimiter();

    app.UseAuthentication();
    app.UseAuthorization();

    // ── Idempotency Middleware — after auth, before endpoint execution ───
    app.UseIdempotency();

    app.MapControllers();
    app.MapHub<NotificationHub>("/hubs/notifications");
    app.MapHealthChecks("/health");

    app.Run();
}
catch (Exception ex) when (ex.GetType().Name == "HostAbortedException")
{
    // Ignore HostAbortedException which is intentionally thrown by EF Core tooling (dotnet ef)
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}

/// <summary>
/// Identity name translator — preserves C# enum member names as-is.
/// Required because PostgreSQL labels are UPPERCASE (MEMBER, QRIS, etc.) matching C# enum names.
/// </summary>
public class NoOpNameTranslator : INpgsqlNameTranslator
{
    public string TranslateTypeName(string clrName) => clrName;
    public string TranslateMemberName(string clrName) => clrName;
}

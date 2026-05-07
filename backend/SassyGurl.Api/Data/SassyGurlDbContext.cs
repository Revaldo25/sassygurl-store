using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Models;
using SassyGurl.Api.Models.Enums;
using SassyGurl.Domain.Entities;
using Npgsql;

namespace SassyGurl.Api.Data;

public class SassyGurlDbContext : DbContext
{
    public SassyGurlDbContext(DbContextOptions<SassyGurlDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Account> Accounts { get; set; } = null!;
    public DbSet<WalletLedger> WalletLedgers { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Game> Games { get; set; } = null!;
    public DbSet<Review> Reviews { get; set; } = null!;
    public DbSet<Provider> Providers { get; set; } = null!;
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<PaymentMethod> PaymentMethods { get; set; } = null!;
    public DbSet<Promo> Promos { get; set; } = null!;
    public DbSet<Transaction> Transactions { get; set; } = null!;
    public DbSet<RefundQueue> RefundQueues { get; set; } = null!;
    public DbSet<SupportTicket> SupportTickets { get; set; } = null!;
    public DbSet<TicketMessage> TicketMessages { get; set; } = null!;
    public DbSet<SystemAudit> SystemAudits { get; set; } = null!;
    public DbSet<SystemSetting> SystemSettings { get; set; } = null!;
    public DbSet<DailyProfit> DailyProfits { get; set; } = null!;
    public DbSet<VerificationToken> VerificationTokens { get; set; } = null!;

    // Phase 1 — Auditable Transaction with JSONB Audit Trail
    public DbSet<AuditableTransaction> AuditableTransactions { get; set; } = null!;

    // Phase 4 — Provider Health Monitoring
    public DbSet<ProviderHealthLog> ProviderHealthLogs { get; set; } = null!;


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map PostgreSQL enums — names match pg_type.typname (PascalCase as created by Prisma)
        modelBuilder.HasPostgresEnum<Role>("Role");
        modelBuilder.HasPostgresEnum<KycStatus>("KycStatus");
        modelBuilder.HasPostgresEnum<PaymentStatus>("PaymentStatus");
        modelBuilder.HasPostgresEnum<OrderStatus>("OrderStatus");
        modelBuilder.HasPostgresEnum<TicketStatus>("TicketStatus");
        modelBuilder.HasPostgresEnum<TicketPriority>("TicketPriority");
        modelBuilder.HasPostgresEnum<MutationType>("MutationType");
        modelBuilder.HasPostgresEnum<PromoType>("PromoType");
        modelBuilder.HasPostgresEnum<PaymentType>("PaymentType");
        modelBuilder.HasPostgresEnum<ProviderSource>("ProviderSource");

        // Set table names to exact Prisma model names (PascalCase)
        modelBuilder.Entity<User>().ToTable("User");
        modelBuilder.Entity<Account>().ToTable("Account");
        modelBuilder.Entity<WalletLedger>().ToTable("WalletLedger");
        modelBuilder.Entity<Category>().ToTable("Category");
        modelBuilder.Entity<Game>().ToTable("Game");
        modelBuilder.Entity<Review>().ToTable("Review");
        modelBuilder.Entity<Provider>().ToTable("Provider");
        modelBuilder.Entity<Product>().ToTable("Product");
        modelBuilder.Entity<PaymentMethod>().ToTable("PaymentMethod");
        modelBuilder.Entity<Promo>().ToTable("Promo");
        modelBuilder.Entity<Transaction>().ToTable("Transaction");
        modelBuilder.Entity<SupportTicket>().ToTable("SupportTicket");
        modelBuilder.Entity<TicketMessage>().ToTable("TicketMessage");
        modelBuilder.Entity<SystemAudit>().ToTable("SystemAudit");
        modelBuilder.Entity<VerificationToken>().ToTable("VerificationToken");

        // Convert PascalCase properties to camelCase column names to match Prisma
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                var propName = property.Name;
                if (!string.IsNullOrEmpty(propName))
                {
                    var camelCaseName = char.ToLowerInvariant(propName[0]) + propName.Substring(1);
                    property.SetColumnName(camelCaseName);
                }
            }
        }

        // Configure Unique constraints matching Prisma schema
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.Phone).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.IdCardNumber).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.ReferralCode).IsUnique();
        
        modelBuilder.Entity<User>().HasIndex(u => new { u.Email, u.Phone, u.ReferralCode });
        modelBuilder.Entity<User>().HasIndex(u => u.KycStatus);

        modelBuilder.Entity<User>()
            .HasOne(u => u.Referrer)
            .WithMany(u => u.Referees)
            .HasForeignKey(u => u.ReferrerId);

        modelBuilder.Entity<WalletLedger>().HasIndex(w => w.TransactionId).IsUnique();
        modelBuilder.Entity<WalletLedger>().HasIndex(w => new { w.UserId, w.Type, w.CreatedAt });

        modelBuilder.Entity<Category>().HasIndex(c => c.Slug).IsUnique();
        
        modelBuilder.Entity<Game>().HasIndex(g => g.Slug).IsUnique();
        
        modelBuilder.Entity<Review>().HasIndex(r => r.TransactionId).IsUnique();
        modelBuilder.Entity<Review>().HasIndex(r => new { r.GameId, r.Rating });

        modelBuilder.Entity<Provider>().HasIndex(p => p.Name).IsUnique();
        
        modelBuilder.Entity<Product>().HasIndex(p => p.Sku).IsUnique();
        modelBuilder.Entity<Product>().HasIndex(p => new { p.Sku, p.GameId, p.IsActive });
        
        modelBuilder.Entity<PaymentMethod>().HasIndex(p => p.Code).IsUnique();
        
        modelBuilder.Entity<Promo>().HasIndex(p => p.Code).IsUnique();
        
        modelBuilder.Entity<Transaction>().HasIndex(t => t.InvoiceId).IsUnique();
        modelBuilder.Entity<Transaction>().HasIndex(t => new { t.InvoiceId, t.PaymentStatus, t.OrderStatus });
        modelBuilder.Entity<Transaction>().HasIndex(t => t.TargetId);
        modelBuilder.Entity<Transaction>().HasIndex(t => t.CreatedAt);

        modelBuilder.Entity<SupportTicket>().HasIndex(s => s.TicketNumber).IsUnique();
        modelBuilder.Entity<SupportTicket>().HasIndex(s => new { s.UserId, s.Status });
        
        modelBuilder.Entity<TicketMessage>().HasIndex(t => t.TicketId);
        
        modelBuilder.Entity<SystemAudit>().HasIndex(s => new { s.ActionBy, s.Entity, s.CreatedAt });

        modelBuilder.Entity<VerificationToken>().HasIndex(v => v.Token).IsUnique();
        modelBuilder.Entity<VerificationToken>().HasIndex(v => new { v.Identifier, v.Token }).IsUnique();

        // ── AuditableTransaction Configuration ──────────────────────────
        modelBuilder.Entity<AuditableTransaction>(entity =>
        {
            entity.ToTable("AuditableTransaction");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OrderNumber).IsUnique();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt).IsDescending();

            // JSONB column for the audit trail array
            entity.Property(e => e.AuditLog)
                .HasColumnType("jsonb")
                .HasDefaultValue("[]");

            // Map column names to camelCase to match existing convention
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderNumber).HasColumnName("orderNumber");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.Amount).HasColumnName("amount");
            entity.Property(e => e.AuditLog).HasColumnName("auditLog");
            entity.Property(e => e.OriginalTransactionId).HasColumnName("originalTransactionId");
            entity.Property(e => e.CreatedAt).HasColumnName("createdAt");
            entity.Property(e => e.UpdatedAt).HasColumnName("updatedAt");
        });

        // ── Performance indexes for Dashboard queries ────────────────────
        // Admin live feed: filter by PaymentStatus + sort by CreatedAt
        modelBuilder.Entity<Transaction>().HasIndex(t => new { t.PaymentStatus, t.CreatedAt })
            .HasDatabaseName("IX_Transaction_PaymentStatus_CreatedAt");
        // Owner profit: group by GameId on paid transactions
        modelBuilder.Entity<Transaction>().HasIndex(t => new { t.GameId, t.PaymentStatus })
            .HasDatabaseName("IX_Transaction_GameId_PaymentStatus");
        // Member dashboard: filter by UserId + status
        modelBuilder.Entity<Transaction>().HasIndex(t => new { t.UserId, t.PaymentStatus, t.CreatedAt })
            .HasDatabaseName("IX_Transaction_UserId_Status_Date");

        // DailyProfit: unique per date, fast lookup for Financial Radar
        modelBuilder.Entity<DailyProfit>().ToTable("DailyProfit");
        modelBuilder.Entity<DailyProfit>().HasIndex(d => d.Date).IsUnique()
            .HasDatabaseName("IX_DailyProfit_Date");

        // RefundQueue: admin dashboard red alerts
        modelBuilder.Entity<RefundQueue>().ToTable("RefundQueue");
        modelBuilder.Entity<RefundQueue>().HasIndex(r => r.IsProcessed)
            .HasDatabaseName("IX_RefundQueue_IsProcessed");

        // SystemSetting: key-value lookup
        modelBuilder.Entity<SystemSetting>().ToTable("SystemSetting");

        modelBuilder.Entity<Account>().HasIndex(a => new { a.Provider, a.ProviderAccountId }).IsUnique();

        // Configure cascade deletes as defined in schema
        modelBuilder.Entity<Product>()
            .HasOne(p => p.Game)
            .WithMany(g => g.Products)
            .HasForeignKey(p => p.GameId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TicketMessage>()
            .HasOne(tm => tm.Ticket)
            .WithMany(t => t.Messages)
            .HasForeignKey(tm => tm.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Account>()
            .HasOne(a => a.User)
            .WithMany(u => u.Accounts)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

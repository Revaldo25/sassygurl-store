using Microsoft.EntityFrameworkCore;
using SassyGurl.Store.Core.Data.Models;

namespace SassyGurl.Store.Core.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Game> Games { get; set; }
        public DbSet<GameProduct> GameProducts { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Item> Items { get; set; }
        public DbSet<PaymentGroup> PaymentGroups { get; set; }
        public DbSet<PaymentMethod> PaymentMethods { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
            modelBuilder.Entity<Game>()
                .HasMany(g => g.GameProducts)
                .WithOne(gp => gp.Game)
                .HasForeignKey(gp => gp.GameId);

            modelBuilder.Entity<GameProduct>()
                .HasMany(gp => gp.Categories)
                .WithOne(c => c.GameProduct)
                .HasForeignKey(c => c.GameProductId);

            modelBuilder.Entity<Category>()
                .HasMany(c => c.Items)
                .WithOne(i => i.Category)
                .HasForeignKey(i => i.CategoryId);

            modelBuilder.Entity<PaymentGroup>()
                .HasMany(pg => pg.PaymentMethods)
                .WithOne(pm => pm.PaymentGroup)
                .HasForeignKey(pm => pm.PaymentGroupId);

            // Seed initial data (optional, but good for testing)
            // This can be done via migrations or a separate seeding service as well
            modelBuilder.Entity<Game>().HasData(
                new Game { Id = 1, Name = "Mobile Legends", Slug = "mobile-legends", IconUrl = "/assets/icons/mobile-legends.webp", BannerUrl = "/assets/banners/mobile-legends.webp", Description = "Mobile Legends: Bang Bang is a mobile multiplayer online battle arena (MOBA) game developed and published by Moonton.", IsActive = true },
                new Game { Id = 2, Name = "Free Fire", Slug = "free-fire", IconUrl = "/assets/icons/free-fire.webp", BannerUrl = "/assets/banners/free-fire.webp", Description = "Garena Free Fire is a battle royale game, developed by 111dots Studio and published by Garena for Android and iOS.", IsActive = true },
                new Game { Id = 3, Name = "Valorant", Slug = "valorant", IconUrl = "/assets/icons/valorant.webp", BannerUrl = "/assets/banners/valorant.webp", Description = "Valorant is a free-to-play tactical first-person shooter developed and published by Riot Games.", IsActive = true },
                new Game { Id = 4, Name = "Honor of Kings", Slug = "honor-of-kings", IconUrl = "/assets/icons/honor-of-kings.webp", BannerUrl = "/assets/banners/honor-of-kings.webp", Description = "Honor of Kings is a multiplayer online battle arena (MOBA) game developed by TiMi Studio Group and published by Tencent Games.", IsActive = true }
            );

            modelBuilder.Entity<GameProduct>().HasData(
                new GameProduct { Id = 1, GameId = 1, Name = "Mobile Legends", Slug = "mobile-legends", Description = "Top up Mobile Legends Diamonds", IsActive = true },
                new GameProduct { Id = 2, GameId = 1, Name = "Patungan Mobile Legend", Slug = "patungan-mobile-legend", Description = "Patungan Mobile Legend Items", IsActive = true },
                new GameProduct { Id = 3, GameId = 2, Name = "Free Fire", Slug = "free-fire", Description = "Top up Free Fire Diamonds", IsActive = true },
                new GameProduct { Id = 4, GameId = 3, Name = "Valorant", Slug = "valorant", Description = "Top up Valorant Points", IsActive = true },
                new GameProduct { Id = 5, GameId = 4, Name = "Honor of Kings", Slug = "honor-of-kings", Description = "Top up Honor of Kings Tokens", IsActive = true }
            );

            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, GameProductId = 1, Name = "Weekly Diamond Pass", Slug = "weekly-diamond-pass", DisplayOrder = 1, IsActive = true },
                new Category { Id = 2, GameProductId = 1, Name = "Diamonds", Slug = "diamonds", DisplayOrder = 2, IsActive = true },
                new Category { Id = 3, GameProductId = 3, Name = "Diamonds", Slug = "diamonds", DisplayOrder = 1, IsActive = true },
                new Category { Id = 4, GameProductId = 3, Name = "Membership", Slug = "membership", DisplayOrder = 2, IsActive = true },
                new Category { Id = 5, GameProductId = 4, Name = "Points", Slug = "points", DisplayOrder = 1, IsActive = true },
                new Category { Id = 6, GameProductId = 5, Name = "Tokens", Slug = "tokens", DisplayOrder = 1, IsActive = true }
            );

            modelBuilder.Entity<Item>().HasData(
                // MLBB Weekly Diamond Pass
                new Item { Id = 1, CategoryId = 1, Name = "Weekly Diamond Pass", PriceIDR = 30145.00m, PriceRM = 6.91m, IsActive = true },
                // MLBB Diamonds
                new Item { Id = 2, CategoryId = 2, Name = "5 Diamonds (5 + 0 Bonus)", PriceIDR = 1571.00m, PriceRM = 0.36m, IsActive = true },
                new Item { Id = 3, CategoryId = 2, Name = "10 Diamonds (10 + 0 Bonus)", PriceIDR = 3144.00m, PriceRM = 0.72m, IsActive = true },
                // Free Fire Diamonds
                new Item { Id = 4, CategoryId = 3, Name = "5 Diamonds", PriceIDR = 982.00m, PriceRM = 0.22m, IsActive = true },
                new Item { Id = 5, CategoryId = 3, Name = "12 Diamonds", PriceIDR = 1921.00m, PriceRM = 0.44m, IsActive = true },
                // Valorant Points
                new Item { Id = 6, CategoryId = 5, Name = "475 Points", PriceIDR = 54747.00m, PriceRM = 12.54m, IsActive = true },
                new Item { Id = 7, CategoryId = 5, Name = "1000 Points", PriceIDR = 109495.00m, PriceRM = 25.08m, IsActive = true },
                // Honor of Kings Tokens
                new Item { Id = 8, CategoryId = 6, Name = "16 Tokens", PriceIDR = 3258.00m, PriceRM = 0.75m, IsActive = true },
                new Item { Id = 9, CategoryId = 6, Name = "80 Tokens", PriceIDR = 15401.00m, PriceRM = 3.53m, IsActive = true }
            );

            modelBuilder.Entity<PaymentGroup>().HasData(
                new PaymentGroup { Id = 1, Name = "QRIS", Slug = "qris", DisplayOrder = 1, IsActive = true },
                new PaymentGroup { Id = 2, Name = "E-Wallet", Slug = "e-wallet", DisplayOrder = 2, IsActive = true },
                new PaymentGroup { Id = 3, Name = "Virtual Account", Slug = "virtual-account", DisplayOrder = 3, IsActive = true },
                new PaymentGroup { Id = 4, Name = "Retail Outlet", Slug = "retail-outlet", DisplayOrder = 4, IsActive = true }
            );

            modelBuilder.Entity<PaymentMethod>().HasData(
                new PaymentMethod { Id = 1, PaymentGroupId = 1, Name = "QRIS", Slug = "qris", IconUrl = "/assets/payment-icons/qris.webp", AdminFee = 0.00m, DisplayOrder = 1, IsActive = true },
                new PaymentMethod { Id = 2, PaymentGroupId = 2, Name = "DANA", Slug = "dana", IconUrl = "/assets/payment-icons/dana.webp", AdminFee = 0.00m, DisplayOrder = 1, IsActive = true },
                new PaymentMethod { Id = 3, PaymentGroupId = 2, Name = "OVO", Slug = "ovo", IconUrl = "/assets/payment-icons/ovo.webp", AdminFee = 0.00m, DisplayOrder = 2, IsActive = true },
                new PaymentMethod { Id = 4, PaymentGroupId = 3, Name = "BCA Virtual Account", Slug = "bca-va", IconUrl = "/assets/payment-icons/bca.webp", AdminFee = 4500.00m, DisplayOrder = 1, IsActive = true },
                new PaymentMethod { Id = 5, PaymentGroupId = 4, Name = "Alfamart", Slug = "alfamart", IconUrl = "/assets/payment-icons/alfamart.webp", AdminFee = 5000.00m, DisplayOrder = 1, IsActive = true }
            );
        }
    }
}

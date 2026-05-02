using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SassyGurl.Store.Core.Data.Models
{
    public class Game
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; }

        [Required]
        [MaxLength(255)]
        public string Slug { get; set; }

        [MaxLength(500)]
        public string IconUrl { get; set; }

        [MaxLength(500)]
        public string BannerUrl { get; set; }

        public string Description { get; set; }

        public bool IsActive { get; set; } = true;

        public ICollection<GameProduct> GameProducts { get; set; }
    }

    public class GameProduct
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int GameId { get; set; }
        public Game Game { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; }

        [Required]
        [MaxLength(255)]
        public string Slug { get; set; }

        public string Description { get; set; }

        public bool IsActive { get; set; } = true;

        public ICollection<Category> Categories { get; set; }
    }

    public class Category
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int GameProductId { get; set; }
        public GameProduct GameProduct { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; }

        [Required]
        [MaxLength(255)]
        public string Slug { get; set; }

        public string Description { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsActive { get; set; } = true;

        public ICollection<Item> Items { get; set; }
    }

    public class Item
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CategoryId { get; set; }
        public Category Category { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal PriceIDR { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? OriginalPriceIDR { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? PriceRM { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal? OriginalPriceRM { get; set; }

        public string BonusInfo { get; set; } // e.g., "(5 + 0 Bonus)"

        public bool IsActive { get; set; } = true;
    }

    public class PaymentGroup
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; }

        [Required]
        [MaxLength(255)]
        public string Slug { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsActive { get; set; } = true;

        public ICollection<PaymentMethod> PaymentMethods { get; set; }
    }

    public class PaymentMethod
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PaymentGroupId { get; set; }
        public PaymentGroup PaymentGroup { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; }

        [Required]
        [MaxLength(255)]
        public string Slug { get; set; }

        [MaxLength(500)]
        public string IconUrl { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal AdminFee { get; set; } = 0.00m;

        public int DisplayOrder { get; set; }

        public bool IsActive { get; set; } = true;
    }
}

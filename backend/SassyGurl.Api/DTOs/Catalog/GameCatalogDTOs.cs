using System.Collections.Generic;

namespace SassyGurl.Store.Core.DTOs
{
    public class GameListDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string IconUrl { get; set; }
        public string BannerUrl { get; set; }
        public string Description { get; set; }
    }

    public class GameDetailDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string IconUrl { get; set; }
        public string BannerUrl { get; set; }
        public string Description { get; set; }
        public List<GameProductDTO> Products { get; set; }
    }

    public class GameProductDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Description { get; set; }
        public List<CategoryDTO> Categories { get; set; }
    }

    public class CategoryDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Description { get; set; }
        public int DisplayOrder { get; set; }
        public List<ItemDTO> Items { get; set; }
    }

    public class ItemDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal PriceIDR { get; set; }
        public decimal? OriginalPriceIDR { get; set; }
        public decimal? PriceRM { get; set; }
        public decimal? OriginalPriceRM { get; set; }
        public string BonusInfo { get; set; }
    }

    public class PaymentGroupDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public int DisplayOrder { get; set; }
        public List<PaymentMethodDTO> PaymentMethods { get; set; }
    }

    public class PaymentMethodDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string IconUrl { get; set; }
        public decimal AdminFee { get; set; }
        public int DisplayOrder { get; set; }
    }
}

using System;
using System.Collections.Generic;

namespace SassyGurl.Domain.Entities.Catalog;

public class Game
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CategoryId { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ShortCode { get; set; } = string.Empty;
    public string CurrencyName { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Banner { get; set; } = string.Empty;
    public string CoverImage { get; set; } = string.Empty;
    public string Accent { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Publisher { get; set; } = string.Empty;
    public bool HasServerId { get; set; }
    public bool IsHot { get; set; }
    public string ServerOptions { get; set; } = string.Empty; // JSON or CSV
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Category Category { get; set; } = null!;
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

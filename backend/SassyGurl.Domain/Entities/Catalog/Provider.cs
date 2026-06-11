using System;

namespace SassyGurl.Domain.Entities.Catalog;

public class Provider
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty; // e.g. "DIGIFLAZZ", "VIPRESELLER"
    public bool IsActive { get; set; } = true;
    public bool IsHealthy { get; set; } = true;
    public DateTime? LastSyncAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

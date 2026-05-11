namespace SassyGurl.Domain.Entities;

/// <summary>
/// Represents a single audit log entry within the JSONB AuditLog column.
/// Captures the before/after state, timestamp, and contextual metadata
/// for every status transition in an AuditableTransaction.
/// </summary>
public class AuditLogEntry
{
    /// <summary>
    /// UTC timestamp of when the status change occurred.
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// The status value before the change. Null for initial creation.
    /// </summary>
    public string? FromStatus { get; set; }

    /// <summary>
    /// The status value after the change.
    /// </summary>
    public string ToStatus { get; set; } = null!;

    /// <summary>
    /// The user or system actor that triggered the change.
    /// </summary>
    public string? ChangedBy { get; set; }

    /// <summary>
    /// Free-form metadata dictionary for contextual information.
    /// Examples: IP address, user agent, reason for status change, provider ref.
    /// </summary>
    public Dictionary<string, object>? Metadata { get; set; }
}

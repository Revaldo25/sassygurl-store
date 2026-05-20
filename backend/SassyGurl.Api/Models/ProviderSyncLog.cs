using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SassyGurl.Api.Models;

/// <summary>
/// Stores raw provider API interactions for debugging, audit, and replay (Master Plan §5.1).
/// Every call to a provider API (sync, order, balance check) should create a record here.
/// </summary>
public class ProviderSyncLog
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>Provider name: "Digiflazz", "VipReseller"</summary>
    [MaxLength(100)]
    public string ProviderName { get; set; } = null!;

    /// <summary>API operation: "pricelist", "transaction", "cek-saldo", "game-feature"</summary>
    [MaxLength(100)]
    public string Operation { get; set; } = null!;

    /// <summary>Raw request payload sent to provider</summary>
    [Column(TypeName = "jsonb")]
    public string? RequestPayload { get; set; }

    /// <summary>Raw response body from provider (truncated if > 500KB)</summary>
    [Column(TypeName = "text")]
    public string? ResponseBody { get; set; }

    /// <summary>HTTP status code returned by provider</summary>
    public int HttpStatus { get; set; }

    /// <summary>Request duration in milliseconds</summary>
    public int DurationMs { get; set; }

    /// <summary>Number of items in response (for pricelist syncs)</summary>
    public int? ItemCount { get; set; }

    /// <summary>Number of errors during processing</summary>
    public int ErrorCount { get; set; } = 0;

    /// <summary>Error message if the call failed</summary>
    [Column(TypeName = "text")]
    public string? ErrorMessage { get; set; }

    /// <summary>Trace/correlation ID for linking with other logs</summary>
    [MaxLength(100)]
    public string? TraceId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using SassyGurl.Domain.Entities;
using SassyGurl.Domain.Enums;

namespace SassyGurl.Infrastructure.Interceptors;

/// <summary>
/// EF Core SaveChangesInterceptor that automatically captures status changes
/// on AuditableTransaction entities and appends audit entries to the JSONB AuditLog column.
/// 
/// How it works:
/// 1. Before SaveChanges is committed, this interceptor scans all tracked entities.
/// 2. For each AuditableTransaction with a modified Status property, it:
///    a. Reads the original Status value from the ChangeTracker.
///    b. Reads the current (new) Status value.
///    c. Creates an AuditLogEntry with timestamp, from/to status, and metadata.
///    d. Deserializes the existing AuditLog JSON array.
///    e. Appends the new entry.
///    f. Serializes back to JSON and updates the AuditLog property.
/// 3. The updated AuditLog is included in the same SaveChanges transaction,
///    ensuring atomicity — either both the status change and audit entry are saved, or neither.
/// 
/// This eliminates the need for manual audit code in any service layer.
/// </summary>
public class TransactionAuditInterceptor : SaveChangesInterceptor
{
    private readonly ILogger<TransactionAuditInterceptor> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public TransactionAuditInterceptor(ILogger<TransactionAuditInterceptor> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Intercepts synchronous SaveChanges calls.
    /// Delegates to the shared audit logic before allowing the save to proceed.
    /// </summary>
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        if (eventData.Context is not null)
        {
            ProcessAuditEntries(eventData.Context);
        }

        return base.SavingChanges(eventData, result);
    }

    /// <summary>
    /// Intercepts asynchronous SaveChangesAsync calls.
    /// Delegates to the shared audit logic before allowing the save to proceed.
    /// </summary>
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
        {
            ProcessAuditEntries(eventData.Context);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    /// <summary>
    /// Core audit logic: scans ChangeTracker for AuditableTransaction entities
    /// with modified Status properties and appends audit log entries.
    /// </summary>
    private void ProcessAuditEntries(DbContext context)
    {
        // Get all AuditableTransaction entities that are being Added or Modified
        var auditableEntries = context.ChangeTracker.Entries<AuditableTransaction>()
            .Where(e => e.State is EntityState.Added or EntityState.Modified)
            .ToList();

        foreach (var entry in auditableEntries)
        {
            try
            {
                string? fromStatus = null;
                string toStatus;

                if (entry.State == EntityState.Added)
                {
                    // New entity — record the initial status
                    toStatus = entry.Entity.Status.ToString();
                }
                else
                {
                    // Modified entity — check if Status actually changed
                    var statusProperty = entry.Property(nameof(AuditableTransaction.Status));

                    // Skip if Status was not modified
                    if (!statusProperty.IsModified) continue;

                    fromStatus = statusProperty.OriginalValue?.ToString();
                    toStatus = statusProperty.CurrentValue?.ToString() ?? "Unknown";

                    // Skip if the value hasn't actually changed (no-op update)
                    if (fromStatus == toStatus) continue;
                }

                // Deserialize existing audit log array
                var existingLog = DeserializeAuditLog(entry.Entity.AuditLog);

                // Create new audit entry
                var auditEntry = new AuditLogEntry
                {
                    Timestamp = DateTime.UtcNow,
                    FromStatus = fromStatus,
                    ToStatus = toStatus,
                    ChangedBy = "system", // Can be enhanced with HttpContext user info
                    Metadata = new Dictionary<string, object>
                    {
                        ["entityState"] = entry.State.ToString(),
                        ["orderNumber"] = entry.Entity.OrderNumber ?? "N/A"
                    }
                };

                existingLog.Add(auditEntry);

                // Serialize back to JSON and update the entity
                entry.Entity.AuditLog = JsonSerializer.Serialize(existingLog, JsonOptions);
                entry.Entity.UpdatedAt = DateTime.UtcNow;

                _logger.LogInformation(
                    "Audit trail recorded: Transaction {OrderNumber} status changed from {FromStatus} to {ToStatus}.",
                    entry.Entity.OrderNumber,
                    fromStatus ?? "N/A",
                    toStatus);
            }
            catch (Exception ex)
            {
                // Audit failures must not block the actual transaction.
                // Log the error but allow SaveChanges to proceed.
                _logger.LogError(ex,
                    "Failed to record audit trail for transaction {OrderNumber}.",
                    entry.Entity.OrderNumber);
            }
        }
    }

    /// <summary>
    /// Safely deserializes the JSONB AuditLog column.
    /// Returns empty list if the value is null, empty, or malformed.
    /// </summary>
    private List<AuditLogEntry> DeserializeAuditLog(string? json)
    {
        if (string.IsNullOrWhiteSpace(json) || json == "[]")
        {
            return new List<AuditLogEntry>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<AuditLogEntry>>(json, JsonOptions)
                   ?? new List<AuditLogEntry>();
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to deserialize existing AuditLog. Starting fresh.");
            return new List<AuditLogEntry>();
        }
    }
}

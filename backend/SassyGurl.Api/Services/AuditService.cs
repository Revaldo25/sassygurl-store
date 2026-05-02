using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.DTOs.Common;
using SassyGurl.Api.Models;
using System.Text.Json;

namespace SassyGurl.Api.Services;

public interface IAuditService
{
    Task LogAsync(string adminId, string action, string entity, string entityId,
        object? oldValues = null, object? newValues = null, string? ip = null, string? userAgent = null);
    Task<ApiResponse<PaginatedResponse<AuditEntryDto>>> GetAuditLogsAsync(string? entity = null, int page = 1, int perPage = 30);
}

public class AuditService : IAuditService
{
    private readonly SassyGurlDbContext _context;

    public AuditService(SassyGurlDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(string adminId, string action, string entity, string entityId,
        object? oldValues = null, object? newValues = null, string? ip = null, string? userAgent = null)
    {
        _context.SystemAudits.Add(new SystemAudit
        {
            ActionBy = adminId,
            Action = action,
            Entity = entity,
            EntityId = entityId,
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
            IpAddress = ip,
            UserAgent = userAgent
        });

        await _context.SaveChangesAsync();
    }

    public async Task<ApiResponse<PaginatedResponse<AuditEntryDto>>> GetAuditLogsAsync(
        string? entity = null, int page = 1, int perPage = 30)
    {
        var query = _context.SystemAudits
            .AsNoTracking()
            .Include(a => a.Admin)
            .AsQueryable();

        if (!string.IsNullOrEmpty(entity))
            query = query.Where(a => a.Entity == entity);

        var total = await query.CountAsync();

        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .Select(a => new AuditEntryDto
            {
                Id = a.Id,
                AdminName = a.Admin.Name ?? a.Admin.Email ?? "System",
                Action = a.Action,
                Entity = a.Entity,
                EntityId = a.EntityId,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                IpAddress = a.IpAddress,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return ApiResponse<PaginatedResponse<AuditEntryDto>>.Ok(new PaginatedResponse<AuditEntryDto>
        {
            Data = logs,
            Total = total,
            Page = page,
            PerPage = perPage
        });
    }
}

public class AuditEntryDto
{
    public string Id { get; set; } = null!;
    public string AdminName { get; set; } = null!;
    public string Action { get; set; } = null!;
    public string Entity { get; set; } = null!;
    public string EntityId { get; set; } = null!;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}

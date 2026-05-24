using System.ComponentModel.DataAnnotations;

namespace SassyGurl.Api.DTOs.Catalog;

public class ReviewResolveDto
{
    [Required]
    public string Action { get; set; } = string.Empty; // "Approve", "Reject", "Remap"

    public string? TargetCategory { get; set; } // Required if Action == "Remap", e.g., "PASS_MEMBERSHIP", "CURRENCY"
}

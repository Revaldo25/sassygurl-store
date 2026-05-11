using System.Text.Json.Serialization;

namespace SassyGurl.Application.DTOs;

/// <summary>
/// Standardized API error response format.
/// All error responses from the API use this format regardless of the exception type.
/// 
/// Example:
/// {
///   "success": false,
///   "message": "Transaction not found.",
///   "errorCode": "NOT_FOUND",
///   "data": null,
///   "traceId": "00-abc123..."
/// }
/// </summary>
public class ApiErrorResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = false;

    [JsonPropertyName("message")]
    public string Message { get; set; } = null!;

    [JsonPropertyName("errorCode")]
    public string ErrorCode { get; set; } = null!;

    [JsonPropertyName("data")]
    public object? Data { get; set; }

    [JsonPropertyName("traceId")]
    public string TraceId { get; set; } = null!;

    /// <summary>
    /// Optional validation errors dictionary.
    /// Only populated when ErrorCode is "VALIDATION_ERROR".
    /// </summary>
    [JsonPropertyName("errors")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyDictionary<string, string[]>? Errors { get; set; }

    public static ApiErrorResponse Create(string message, string errorCode, string traceId)
    {
        return new ApiErrorResponse
        {
            Success = false,
            Message = message,
            ErrorCode = errorCode,
            Data = null,
            TraceId = traceId
        };
    }
}

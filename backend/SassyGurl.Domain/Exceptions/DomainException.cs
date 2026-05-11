namespace SassyGurl.Domain.Exceptions;

/// <summary>
/// Base exception for all domain-level business rule violations.
/// These exceptions are caught by ExceptionMiddleware and translated
/// into standardized error responses with appropriate HTTP status codes.
/// </summary>
public class DomainException : Exception
{
    /// <summary>
    /// Machine-readable error code for client-side handling.
    /// Examples: "INSUFFICIENT_BALANCE", "PRODUCT_OUT_OF_STOCK"
    /// </summary>
    public string ErrorCode { get; }

    public DomainException(string message, string errorCode = "DOMAIN_ERROR")
        : base(message)
    {
        ErrorCode = errorCode;
    }

    public DomainException(string message, string errorCode, Exception innerException)
        : base(message, innerException)
    {
        ErrorCode = errorCode;
    }
}

/// <summary>
/// Thrown when a requested entity cannot be found.
/// Maps to HTTP 404 Not Found.
/// </summary>
public class NotFoundException : DomainException
{
    public NotFoundException(string entityName, object id)
        : base($"{entityName} with identifier '{id}' was not found.", "NOT_FOUND")
    {
    }
}

/// <summary>
/// Thrown when a business validation rule is violated.
/// Maps to HTTP 422 Unprocessable Entity.
/// </summary>
public class ValidationException : DomainException
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation errors occurred.", "VALIDATION_ERROR")
    {
        Errors = new Dictionary<string, string[]>(errors);
    }

    public ValidationException(string message)
        : base(message, "VALIDATION_ERROR")
    {
        Errors = new Dictionary<string, string[]>();
    }
}

/// <summary>
/// Thrown when the user lacks permission for the requested operation.
/// Maps to HTTP 403 Forbidden.
/// </summary>
public class ForbiddenException : DomainException
{
    public ForbiddenException(string message = "You do not have permission to perform this action.")
        : base(message, "FORBIDDEN")
    {
    }
}

/// <summary>
/// Thrown when a business-level conflict occurs (e.g., duplicate order).
/// Maps to HTTP 409 Conflict.
/// </summary>
public class ConflictException : DomainException
{
    public ConflictException(string message)
        : base(message, "CONFLICT")
    {
    }
}

namespace SassyGurl.Domain.Entities;

public class ChatMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ChatSessionId { get; set; } = null!;
    public string SenderRole { get; set; } = null!; // Customer, Admin
    public string MessageText { get; set; } = null!;
    public bool IsRead { get; set; } = false;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public virtual ChatSession ChatSession { get; set; } = null!;
}

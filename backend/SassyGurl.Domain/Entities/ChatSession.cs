namespace SassyGurl.Domain.Entities;

public class ChatSession
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string? UserId { get; set; } // Null if guest
    public string GuestName { get; set; } = "Guest";
    public string Channel { get; set; } = "Web"; // Web, WhatsApp, Telegram
    public string Status { get; set; } = "Active"; // Active, Closed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}

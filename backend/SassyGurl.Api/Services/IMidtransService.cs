using System.Text.Json;
using System.Text.Json.Serialization;

namespace SassyGurl.Api.Services;

public interface IMidtransService
{
    Task<string?> GenerateSnapTokenAsync(
        string orderId, 
        decimal grossAmount, 
        string productName, 
        string customerName, 
        string customerEmail, 
        string customerPhone);
}

public class MidtransTransactionDetails
{
    [JsonPropertyName("order_id")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("gross_amount")]
    public decimal GrossAmount { get; set; }
}

public class MidtransItemDetails
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class MidtransCustomerDetails
{
    [JsonPropertyName("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;
}

public class MidtransSnapRequest
{
    [JsonPropertyName("transaction_details")]
    public MidtransTransactionDetails TransactionDetails { get; set; } = new();

    [JsonPropertyName("item_details")]
    public List<MidtransItemDetails> ItemDetails { get; set; } = new();

    [JsonPropertyName("customer_details")]
    public MidtransCustomerDetails CustomerDetails { get; set; } = new();
}

public class MidtransSnapResponse
{
    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [JsonPropertyName("redirect_url")]
    public string RedirectUrl { get; set; } = string.Empty;
}

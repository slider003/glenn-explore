using System.Text.Json.Serialization;

namespace Api.Source.Features.Models.Dtos;

public class UnlockedModelDto
{
    [JsonPropertyName("modelId")]
    public string ModelId { get; set; }
    
    [JsonPropertyName("purchasedAt")]
    public DateTime PurchasedAt { get; set; }
}

public class ModelInfoDto
{
    [JsonPropertyName("modelId")]
    public string ModelId { get; set; }
    
    [JsonPropertyName("name")]
    public string Name { get; set; }
    
    [JsonPropertyName("price")]
    public decimal Price { get; set; }
    
    [JsonPropertyName("isPremium")]
    public bool IsPremium { get; set; }
    
    [JsonPropertyName("isUnlocked")]
    public bool IsUnlocked { get; set; }
}

public class PurchaseModelRequest
{
    [JsonPropertyName("modelId")]
    public string ModelId { get; set; }
}

public class PurchaseModelResponse
{
    [JsonPropertyName("checkoutUrl")]
    public string CheckoutUrl { get; set; }
}

public class GrantPremiumModelsResponse
{
    [JsonPropertyName("usersProcessed")]
    public int UsersProcessed { get; set; }
    
    [JsonPropertyName("modelsGranted")]
    public int ModelsGranted { get; set; }
    
    [JsonPropertyName("message")]
    public string Message { get; set; }
}

public class AdminUnlockModelRequest
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; }
    
    [JsonPropertyName("modelId")]
    public string ModelId { get; set; }
} 
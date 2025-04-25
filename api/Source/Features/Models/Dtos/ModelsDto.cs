using System.Text.Json.Serialization;

namespace Api.Source.Features.Models.Dtos;

// Base interface for all model configs
public interface IModelConfig
{
    ModelObject Model { get; }
}

// Base model configuration types
public class ModelObject
{
    [JsonPropertyName("obj")]
    public string Obj { get; set; } = string.Empty;
    
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonPropertyName("scale")]
    public float Scale { get; set; }
    
    [JsonPropertyName("units")]
    public string Units { get; set; } = string.Empty;
    
    [JsonPropertyName("rotation")]
    public ModelRotation Rotation { get; set; } = new();
    
    [JsonPropertyName("anchor")]
    public string Anchor { get; set; } = string.Empty;
    
    [JsonPropertyName("elevationOffset")]
    public float? ElevationOffset { get; set; }

    [JsonPropertyName("screenshot")]
    public string Screenshot { get; set; } = string.Empty;
}

public class ModelRotation
{
    [JsonPropertyName("x")]
    public float X { get; set; }
    
    [JsonPropertyName("y")]
    public float Y { get; set; }
    
    [JsonPropertyName("z")]
    public float Z { get; set; }
}

// Player specific types
public class PlayerPhysics
{
    [JsonPropertyName("walkMaxVelocity")]
    public float WalkMaxVelocity { get; set; }
    
    [JsonPropertyName("runMaxVelocity")]
    public float RunMaxVelocity { get; set; }
    
    [JsonPropertyName("walkAcceleration")]
    public float WalkAcceleration { get; set; }
    
    [JsonPropertyName("runAcceleration")]
    public float RunAcceleration { get; set; }
    
    [JsonPropertyName("deceleration")]
    public float Deceleration { get; set; }
    
    [JsonPropertyName("rotationSpeed")]
    public float RotationSpeed { get; set; }
    
    [JsonPropertyName("jumpForce")]
    public float JumpForce { get; set; }
    
    [JsonPropertyName("gravity")]
    public float Gravity { get; set; }
}

public class PlayerWalkingAnimation
{
    [JsonPropertyName("walkSpeed")]
    public float WalkSpeed { get; set; }
    
    [JsonPropertyName("runSpeed")]
    public float RunSpeed { get; set; }
    
    [JsonPropertyName("idleAnimation")]
    public string IdleAnimation { get; set; } = string.Empty;
    
    [JsonPropertyName("walkAnimation")]
    public string WalkAnimation { get; set; } = string.Empty;
    
    [JsonPropertyName("runAnimation")]
    public string RunAnimation { get; set; } = string.Empty;
}

public class PlayerModelConfig : IModelConfig
{
    [JsonPropertyName("model")]
    public ModelObject Model { get; set; } = new();
    
    [JsonPropertyName("physics")]
    public PlayerPhysics Physics { get; set; } = new();
    
    [JsonPropertyName("walkingAnimation")]
    public PlayerWalkingAnimation WalkingAnimation { get; set; } = new();
}

// Car specific types
public class CarPhysics
{
    [JsonPropertyName("maxSpeed")]
    public float MaxSpeed { get; set; }
    
    [JsonPropertyName("acceleration")]
    public float Acceleration { get; set; }
    
    [JsonPropertyName("brakeForce")]
    public float BrakeForce { get; set; }
    
    [JsonPropertyName("reverseSpeed")]
    public float ReverseSpeed { get; set; }
    
    [JsonPropertyName("turnSpeed")]
    public float TurnSpeed { get; set; }
    
    [JsonPropertyName("friction")]
    public float Friction { get; set; }
}

public class CarDrivingAnimation
{
    [JsonPropertyName("drivingAnimation")]
    public string DrivingAnimation { get; set; } = string.Empty;
}

public class CarModelConfig : IModelConfig
{
    [JsonPropertyName("model")]
    public ModelObject Model { get; set; } = new();
    
    [JsonPropertyName("physics")]
    public CarPhysics Physics { get; set; } = new();
    
    [JsonPropertyName("drivingAnimation")]
    public CarDrivingAnimation DrivingAnimation { get; set; } = new();
}

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
    
    [JsonPropertyName("type")]
    public string Type { get; set; }
    
    [JsonPropertyName("price")]
    public decimal Price { get; set; }
    
    [JsonPropertyName("isPremium")]
    public bool IsPremium { get; set; }
    
    [JsonPropertyName("isUnlocked")]
    public bool IsUnlocked { get; set; }
    
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }
    
    [JsonPropertyName("thumbnailUrl")]
    public string ThumbnailUrl { get; set; }
    
    [JsonPropertyName("modelUrl")]
    public string ModelUrl { get; set; }

    [JsonPropertyName("config")]
    public IModelConfig Config { get; set; }

    [JsonPropertyName("screenshot")]
    public string Screenshot { get; set; }

    [JsonPropertyName("isFeatured")]
    public bool IsFeatured { get; set; }

    [JsonPropertyName("createdById")]
    public string CreatedById { get; set; }
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

public class ModelDetailsDto
{
    [JsonPropertyName("modelId")]
    public string ModelId { get; set; }
    
    [JsonPropertyName("name")]
    public string Name { get; set; }
    
    [JsonPropertyName("type")]
    public string Type { get; set; }
    
    [JsonPropertyName("configJson")]
    public string ConfigJson { get; set; }
    
    [JsonPropertyName("config")]
    public IModelConfig Config { get; set; }
    
    [JsonPropertyName("price")]
    public decimal Price { get; set; }
    
    [JsonPropertyName("isPremium")]
    public bool IsPremium { get; set; }
    
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }
    
    [JsonPropertyName("thumbnailUrl")]
    public string ThumbnailUrl { get; set; }
    
    [JsonPropertyName("thumbnailFileId")]
    public string ThumbnailFileId { get; set; }
    
    [JsonPropertyName("modelUrl")]
    public string ModelUrl { get; set; }
    
    [JsonPropertyName("modelFileId")]
    public string ModelFileId { get; set; }
    
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
    
    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; }

    [JsonPropertyName("screenshot")]
    public string Screenshot { get; set; }

    [JsonPropertyName("isUnlocked")]
    public bool IsUnlocked { get; set; } = false;

    [JsonPropertyName("isFeatured")]
    public bool IsFeatured { get; set; }

    [JsonPropertyName("createdById")]
    public string CreatedById { get; set; }
}

// Request DTOs for model management
public class CreateModelRequest
{
    [JsonPropertyName("name")]
    public string Name { get; set; }
    
    [JsonPropertyName("type")]
    public string Type { get; set; }
    
    [JsonPropertyName("configJson")]
    public string ConfigJson { get; set; }
    
    [JsonPropertyName("isPremium")]
    public bool IsPremium { get; set; }
    
    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("thumbnailFileId")]
    public string ThumbnailFileId { get; set; }
    
    [JsonPropertyName("modelFileId")]
    public string ModelFileId { get; set; }
}

public class UpdateModelRequest
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    
    [JsonPropertyName("type")]
    public string? Type { get; set; }
    
    [JsonPropertyName("configJson")]
    public string? ConfigJson { get; set; }
    
    [JsonPropertyName("isPremium")]
    public bool? IsPremium { get; set; }
    
    [JsonPropertyName("price")]
    public decimal? Price { get; set; }

    [JsonPropertyName("isFeatured")]
    public bool? IsFeatured { get; set; }

    [JsonPropertyName("thumbnailFileId")]
    public string ThumbnailFileId { get; set; }
    
    [JsonPropertyName("modelFileId")]
    public string ModelFileId { get; set; }
}
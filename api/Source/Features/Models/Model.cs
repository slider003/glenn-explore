using System.ComponentModel.DataAnnotations;
using Api.Source.Features.Files.Models;

namespace Api.Source.Features.Models;

public class Model
{
    [Key]
    public string ModelId { get; set; } = string.Empty;
    
    public string Name { get; set; } = string.Empty;
    
    public string Type { get; set; } = string.Empty; // "car" or "walking"
    
    public string ConfigJson { get; set; } = string.Empty;
    
    public bool IsPremium { get; set; }
    
    public decimal Price { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // File relations
    public string? ThumbnailFileId { get; set; }
    public FileEntity? ThumbnailFile { get; set; }
    
    public string? ModelFileId { get; set; }
    public FileEntity? ModelFile { get; set; }
    
    // Navigation property for unlocked relations
    public ICollection<UnlockedModel> UnlockedModels { get; set; } = new List<UnlockedModel>();
} 
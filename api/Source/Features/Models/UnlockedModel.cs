using Api.Features.Auth.Models;
using System.ComponentModel.DataAnnotations;

namespace Api.Source.Features.Models;

public class UnlockedModel
{
    [Key]
    public int Id { get; set; }
    
    public string UserId { get; set; }
    
    public string ModelId { get; set; }
    
    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public User User { get; set; }
} 
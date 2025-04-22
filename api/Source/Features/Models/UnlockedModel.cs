using Api.Features.Auth.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Source.Features.Models;

public class UnlockedModel
{
    [Key]
    public int Id { get; set; }
    
    public string UserId { get; set; }
    
    public string ModelId { get; set; }
    
    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public User User { get; set; }
    
    [ForeignKey("ModelId")]
    public Model Model { get; set; }
} 
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema;
using Api.Features.Auth.Models;

namespace Api.Source.Features.Marketing.Models;

[Table("CampaignRecipients")]
public class CampaignRecipient
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    public string CampaignId { get; set; } = string.Empty;
    
    [ForeignKey(nameof(CampaignId))]
    [JsonIgnore]
    public Campaign? Campaign { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
    
    [Required]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Status { get; set; } = "pending"; // pending, sent, opened, failed
    
    public DateTime? SentAt { get; set; }
    
    public DateTime? OpenedAt { get; set; }
    
    public string? ErrorMessage { get; set; }
    
    public DateTime? LastSeenBefore { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

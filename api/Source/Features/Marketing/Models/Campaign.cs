using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Source.Features.Marketing.Models;

[Table("Campaigns")]
public class Campaign
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    [Required]
    public string EmailTemplateId { get; set; } = string.Empty;
    
    [ForeignKey(nameof(EmailTemplateId))]
    public EmailTemplate? EmailTemplate { get; set; }
    
    [Required]
    public string Status { get; set; } = "draft"; // draft, sending, paused, completed, canceled
    
    public int TotalRecipients { get; set; }
    
    public int SentCount { get; set; }
    
    public int OpenCount { get; set; }
    
    public int ErrorCount { get; set; }
    
    public DateTime? StartedAt { get; set; }
    
    public DateTime? CompletedAt { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Required]
    public string CreatedBy { get; set; } = string.Empty;
    
    public virtual ICollection<CampaignRecipient> Recipients { get; set; } = new List<CampaignRecipient>();
}

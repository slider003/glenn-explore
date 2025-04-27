using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Source.Features.Game;

[Table("QuestProgress")]
public class QuestProgress
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    [ForeignKey("Player")]
    public string PlayerId { get; set; } = null!;
    
    [Required]
    public string QuestId { get; set; } = null!;
    
    [Required]
    public int Progress { get; set; }
    
    [Required]
    public DateTime UpdatedAt { get; set; }
    
    // Navigation property
    public virtual Player Player { get; set; } = null!;
    
    public static QuestProgress Create(string playerId, string questId, int progress)
    {
        return new QuestProgress
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            QuestId = questId,
            Progress = progress,
            UpdatedAt = DateTime.UtcNow
        };
    }
    
    public void UpdateProgress(int progress)
    {
        Progress = progress;
        UpdatedAt = DateTime.UtcNow;
    }
}

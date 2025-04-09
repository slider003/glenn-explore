using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Source.Features.Game;

[Table("RaceResults")]
public class RaceResult
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    [ForeignKey("Player")]
    public string PlayerId { get; set; } = null!;
    
    [Required]
    public string PlayerName { get; set; } = null!;
    
    [Required]
    public string TrackId { get; set; } = null!;
    
    [Required]
    public double Time { get; set; }
    
    [Required]
    public DateTime CompletedAt { get; set; }
    
    // Navigation property
    public virtual Player Player { get; set; } = null!;
    
    public static RaceResult Create(string playerId, string playerName, string trackId, double time)
    {
        return new RaceResult
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            PlayerName = playerName,
            TrackId = trackId,
            Time = time,
            CompletedAt = DateTime.UtcNow
        };
    }
} 
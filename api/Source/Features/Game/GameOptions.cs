namespace Api.Source.Features.Game;

public class GameOptions
{
    public const string SectionName = "Game";
    
    /// <summary>
    /// How long to keep player states in memory after their last activity.
    /// After this time, inactive players will be removed from memory but remain in the database.
    /// Default: 5 minutes - balances quick cleanup with handling brief disconnects.
    /// </summary>
    public int InactiveThresholdMinutes { get; set; } = 5;
    
    /// <summary>
    /// How often to save player states to database.
    /// Lower values mean less data loss on crashes but more database load.
    /// For a driving game, position history isn't super critical.
    /// Default: 5 seconds - good balance between data safety and database load.
    /// - 12 saves per minute instead of 20
    /// - Still captures important state changes
    /// - Reasonable position history preservation
    /// </summary>
    public int PersistenceIntervalSeconds { get; set; } = 5;
} 
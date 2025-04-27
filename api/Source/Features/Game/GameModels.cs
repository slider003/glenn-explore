namespace Api.Source.Features.Game;

public class PlayerState
{
    public string PlayerId { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public DateTime LastSeen { get; set; }
    public Position? Position { get; set; }
    public DateTime? CurrentSessionStart { get; set; }
    public TimeSpan TotalTimeOnline { get; set; }
    public double CurrentSpeed { get; set; }
    public double KilometersDriven { get; set; }
    public string ModelType { get; set; } = "dino";
    public string AnimationState { get; set; } = "idle";
    public string StateType { get; set; } = "walking";
    public List<QuestProgress> QuestProgress { get; set; } = new();
}

public class PositionUpdate
{
    public Position Position { get; set; } = new();
    public double CurrentSpeed { get; set; }
    public double KilometersDriven { get; set; }
    public string ModelType { get; set; } = "dino";
    public string AnimationState { get; set; } = "idle";
    public string StateType { get; set; } = "walking";
}

public class Position
{
    public double[] Coordinates { get; set; } = null!;
    public Rotation Rotation { get; set; } = new();
    public long Timestamp { get; set; }
}

public class Rotation
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Z { get; set; }
}

public record ChatMessageEvent(
    string PlayerId,
    string? Name,
    string Message,
    bool IsSystem,
    bool IsGuest,
    DateTime Timestamp
);

public record RaceResultEvent(
    string PlayerId,
    string PlayerName,
    string TrackId,
    string TrackName,
    double Time,
    bool IsPersonalBest,
    bool IsTrackRecord,
    DateTime CompletedAt
);

public record RaceResultResponse(
    bool IsPersonalBest,
    bool IsTrackRecord,
    double? PreviousPersonalBest,
    double? PreviousTrackRecord
);

public record RaceRecordResponse(
    double? PersonalBest,
    double? TrackRecord,
    string? TrackRecordHolder
);

public record QuestProgressEvent(
    string PlayerId,
    string QuestId,
    int Progress,
    DateTime UpdatedAt
);

public record QuestCompletedEvent(
    string PlayerId,
    string QuestId,
    string QuestTitle,
    int XpGained,
    DateTime CompletedAt
);


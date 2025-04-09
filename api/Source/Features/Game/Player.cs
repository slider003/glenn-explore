using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Source.Features.Game;

[Table("Players")]
public class Player
{
    [Key]
    public string PlayerId { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public DateTime LastSeen { get; set; }

    // Position
    public double? X { get; set; }
    public double? Y { get; set; }
    public double? Z { get; set; }
    public double? RotationX { get; set; }
    public double? RotationY { get; set; }
    public double? RotationZ { get; set; }

    // Stats
    public double CurrentSpeed { get; set; }
    public double KilometersDriven { get; set; }

    // State
    public string ModelType { get; set; } = "cesiumMan";
    public string AnimationState { get; set; } = "idle";
    public string StateType { get; set; } = "walking";
    public TimeSpan TotalTimeOnline { get; set; }

    // Time tracking
    public DateTime? CurrentSessionStart { get; set; }

    // Conversion methods
    public static Player FromPlayerState(PlayerState state)
    {
        return new Player
        {
            PlayerId = state.PlayerId,
            Name = state.Name,
            LastSeen = state.LastSeen,
            X = state.Position?.Coordinates?[0],
            Y = state.Position?.Coordinates?[1],
            Z = state.Position?.Coordinates?[2],
            RotationX = state.Position?.Rotation.X,
            RotationY = state.Position?.Rotation.Y,
            RotationZ = state.Position?.Rotation.Z,
            CurrentSpeed = state.CurrentSpeed,
            KilometersDriven = state.KilometersDriven,
            ModelType = state.ModelType,
            AnimationState = state.AnimationState,
            StateType = state.StateType,
            CurrentSessionStart = state.CurrentSessionStart,
            TotalTimeOnline = state.TotalTimeOnline,
        };
    }

    public PlayerState ToPlayerState()
    {
        return new PlayerState
        {
            PlayerId = PlayerId,
            Name = Name,
            LastSeen = LastSeen,
            Position = (X.HasValue && Y.HasValue && Z.HasValue) ? new Position
            {
                Coordinates = new[] { X.Value, Y.Value, Z.Value },
                Rotation = new Rotation
                {
                    X = RotationX ?? 0,
                    Y = RotationY ?? 0,
                    Z = RotationZ ?? 0
                },
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            } : null,
            CurrentSpeed = CurrentSpeed,
            KilometersDriven = KilometersDriven,
            ModelType = ModelType,
            AnimationState = AnimationState,
            StateType = StateType,
            CurrentSessionStart = CurrentSessionStart,
            TotalTimeOnline = TotalTimeOnline
        };
    }
}
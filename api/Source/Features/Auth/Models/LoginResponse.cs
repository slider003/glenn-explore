namespace Api.Features.Auth.Models;

public record LoginResponse(
    string PlayerId,
    string Username,
    string FirstName,
    string LastName,
    string Email,
    bool IsGuest,
    bool IsAdmin,
    LastPosition? LastPosition = null,
    string? GuestKey = null,
    bool HasPaid = false
);

public class LastPosition
{
    public double? X { get; set; }
    public double? Y { get; set; }
    public double? Z { get; set; }
    public double? RotationX { get; set; }
    public double? RotationY { get; set; }
    public double? RotationZ { get; set; }
} 
namespace Api.Features.Auth.Models;

public record UserProfileResponse(
    string Id,
    string Username,
    string FirstName,
    string LastName,
    bool IsActive,
    bool IsGuest,
    bool IsAdmin,
    DateTime CreatedAt,
    DateTime? LastLoginAt
); 
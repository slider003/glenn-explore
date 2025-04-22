namespace Api.Features.UserManagement.Models;

public record UserResponse(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    bool IsActive,
    bool HasPaid,
    bool IsLowPerformanceDevice,
    DateTime CreatedAt,
    DateTime? LastLoginAt,
    DateTime LastSeen,
    TimeSpan TotalTimeOnline
); 
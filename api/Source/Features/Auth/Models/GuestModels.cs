using System.ComponentModel.DataAnnotations;

namespace Api.Features.Auth.Models;

public record CreateGuestRequest(
    [Required]
    string GuestId,
    
    // GuestKey is optional for first login, but if provided must be at least 32 chars
    [MinLength(32, ErrorMessage = "Invalid guest key format")]
    string? GuestKey = null
); 

public record ClaimAccountRequest(
    [Required]
    [RunescapeUsername]
    string Username,
    
    [Required]
    [MinLength(6)]
    string Password,
    
    string? Email = null  // Optional email
); 
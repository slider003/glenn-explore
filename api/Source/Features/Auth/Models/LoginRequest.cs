using System.ComponentModel.DataAnnotations;

namespace Api.Features.Auth.Models;

public record LoginRequest(
    [Required]
    [RunescapeUsername]
    string Username,
    
    [Required]
    [MinLength(6)]
    string Password
);
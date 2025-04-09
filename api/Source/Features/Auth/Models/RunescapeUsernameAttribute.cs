using System.ComponentModel.DataAnnotations;
using Api.Features.Auth.Services;

namespace Api.Features.Auth.Models;

public class RunescapeUsernameAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value == null) return new ValidationResult("Username is required");
        
        var username = value.ToString();
        if (!UsernameGenerator.IsValidUsername(username))
        {
            return new ValidationResult(
                "Username must be 1-16 characters, start with a letter, and contain only letters, numbers, underscore, or hyphen"
            );
        }

        return ValidationResult.Success;
    }
} 
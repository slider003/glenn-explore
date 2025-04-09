using Microsoft.AspNetCore.Identity;

namespace Api.Features.Auth.Models;

public class User : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsGuest { get; set; }
    public bool IsAdmin { get; set; } = false;
    public string? GuestKey { get; set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; private set; }
    public DateTime LastSeen { get; private set; } = DateTime.UtcNow;
    
    // OTP properties
    public string? OtpCode { get; private set; }
    public DateTime? OtpExpiration { get; private set; }
    public bool IsEmailVerified { get; set; }

    public void UpdateLastLogin()
    {
        LastLoginAt = DateTime.UtcNow;
        LastSeen = DateTime.UtcNow;
    }

    public void UpdateLastSeen()
    {
        LastSeen = DateTime.UtcNow;
    }
    
    public void SetOtp(string code, TimeSpan validFor)
    {
        OtpCode = code;
        OtpExpiration = DateTime.UtcNow.Add(validFor);
    }
    
    public bool IsOtpValid(string code)
    {
        return OtpCode == code && 
               OtpExpiration.HasValue && 
               DateTime.UtcNow <= OtpExpiration.Value;
    }
    
    public void ClearOtp()
    {
        OtpCode = null;
        OtpExpiration = null;
    }
    
    public void MarkEmailAsVerified()
    {
        IsEmailVerified = true;
    }
}
using System.ComponentModel.DataAnnotations;

namespace Api.Features.Auth.Models
{
    public class RequestOtpRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        // Optional fields for guest account migration
        public string? GuestId { get; set; }
        public string? GuestKey { get; set; }
    }
    
    public class VerifyOtpRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string OtpCode { get; set; } = string.Empty;
        public bool IsLowPerformanceDevice { get; set; } = false;
    }
    
    public class RequestOtpResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsExistingUser { get; set; }
        public string? ExpiresAt { get; set; }
    }
} 
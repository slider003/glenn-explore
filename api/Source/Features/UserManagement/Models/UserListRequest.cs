using System.ComponentModel.DataAnnotations;

namespace Api.Features.UserManagement.Models;

public record UserListRequest(
    [Range(1, int.MaxValue)]
    int Page = 1,
    
    [Range(1, 100)]
    int PageSize = 10,
    
    string? SearchTerm = null,
    
    // Sorting
    string? SortBy = null,
    bool SortDescending = false,
    
    // Filters
    bool? IsActive = null,
    bool? HasPaid = null,
    bool? IsSubscribedToEmails = null,
    DateTime? LastLoginFrom = null,
    DateTime? LastLoginTo = null,
    DateTime? CreatedFrom = null,
    DateTime? CreatedTo = null
); 
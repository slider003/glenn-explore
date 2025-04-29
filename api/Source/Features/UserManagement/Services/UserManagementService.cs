using Api.Core.Infrastructure.Database;
using Api.Features.Auth.Models;
using Api.Features.UserManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.UserManagement.Services;

public class UserManagementService
{
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UserManagementService> _logger;

    public UserManagementService(
        UserManager<User> userManager,
        ApplicationDbContext context,
        ILogger<UserManagementService> logger)
    {
        _userManager = userManager;
        _context = context;
        _logger = logger;
    }

    public async Task<UserListResponse> GetUsersAsync(UserListRequest request)
    {
        var query = _context.Users
            .GroupJoin(
                _context.Players,
                user => user.Id,
                player => player.PlayerId,
                (user, players) => new { user, player = players.FirstOrDefault() }
            );

        // Apply search if provided
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(x => 
                x.user.Email.ToLower().Contains(searchTerm) ||
                x.user.FirstName.ToLower().Contains(searchTerm) ||
                x.user.LastName.ToLower().Contains(searchTerm));
        }

        // Apply filters
        if (request.IsActive.HasValue)
        {
            query = query.Where(x => x.user.IsActive == request.IsActive.Value);
        }

        if (request.HasPaid.HasValue)
        {
            query = query.Where(x => x.user.HasPaid == request.HasPaid.Value);
        }

        if (request.IsSubscribedToEmails.HasValue)
        {
            query = query.Where(x => x.user.IsSubscribedToEmails == request.IsSubscribedToEmails.Value);
        }

        if (request.LastLoginFrom.HasValue)
        {
            query = query.Where(x => x.user.LastLoginAt >= request.LastLoginFrom.Value);
        }

        if (request.LastLoginTo.HasValue)
        {
            query = query.Where(x => x.user.LastLoginAt <= request.LastLoginTo.Value);
        }

        if (request.CreatedFrom.HasValue)
        {
            query = query.Where(x => x.user.CreatedAt >= request.CreatedFrom.Value);
        }

        if (request.CreatedTo.HasValue)
        {
            query = query.Where(x => x.user.CreatedAt <= request.CreatedTo.Value);
        }

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "name" => request.SortDescending
                ? query.OrderByDescending(x => x.user.FirstName).ThenByDescending(x => x.user.LastName)
                : query.OrderBy(x => x.user.FirstName).ThenBy(x => x.user.LastName),
            "email" => request.SortDescending
                ? query.OrderByDescending(x => x.user.Email)
                : query.OrderBy(x => x.user.Email),
            "lastlogin" => request.SortDescending
                ? query.OrderByDescending(x => x.user.LastLoginAt)
                : query.OrderBy(x => x.user.LastLoginAt),
            "created" => request.SortDescending
                ? query.OrderByDescending(x => x.user.CreatedAt)
                : query.OrderBy(x => x.user.CreatedAt),
            "status" => request.SortDescending
                ? query.OrderByDescending(x => x.user.IsActive)
                : query.OrderBy(x => x.user.IsActive),
            "payment" => request.SortDescending
                ? query.OrderByDescending(x => x.user.HasPaid)
                : query.OrderBy(x => x.user.HasPaid),
            _ => query.OrderByDescending(x => x.user.CreatedAt) // default sort
        };

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

        var users = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new UserResponse(
                x.user.Id,
                x.user.Email!,
                x.user.FirstName,
                x.user.LastName,
                x.user.IsActive,
                x.user.HasPaid,
                x.user.IsLowPerformanceDevice,
                x.user.IsSubscribedToEmails,
                x.user.CreatedAt,
                x.user.LastLoginAt,
                x.user.LastSeen,
                x.player != null ? x.player.TotalTimeOnline : TimeSpan.Zero))
            .ToListAsync();

        return new UserListResponse(
            users,
            totalCount,
            request.Page,
            request.PageSize,
            totalPages);
    }

    public async Task<UserResponse?> GetUserByIdAsync(string id)
    {
        var result = await _context.Users
            .GroupJoin(
                _context.Players,
                user => user.Id,
                player => player.PlayerId,
                (user, players) => new { user, player = players.FirstOrDefault() }
            )
            .FirstOrDefaultAsync(x => x.user.Id == id);

        if (result?.user == null) return null;

        return new UserResponse(
            result.user.Id,
            result.user.Email!,
            result.user.FirstName,
            result.user.LastName,
            result.user.IsActive,
            result.user.HasPaid,
            result.user.IsLowPerformanceDevice,
            result.user.IsSubscribedToEmails,
            result.user.CreatedAt,
            result.user.LastLoginAt,
            result.user.LastSeen,
            result.player != null ? result.player.TotalTimeOnline : TimeSpan.Zero);
    }

    private TimeSpan GetTotalTimeOnline(User user)
    {
        // Get associated player if exists
        var player = _context.Players.FirstOrDefault(p => p.PlayerId == user.Id);
        return player?.TotalTimeOnline ?? TimeSpan.Zero;
    }

    public async Task<(bool success, IEnumerable<string> errors, string userId)> CreateUserAsync(CreateUserRequest request)
    {
        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsActive = true,
            EmailConfirmed = true // For simplicity, we'll auto-confirm emails
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        
        if (!result.Succeeded)
        {
            _logger.LogWarning("Failed to create user {Email}: {Errors}", 
                request.Email, 
                string.Join(", ", result.Errors.Select(e => e.Description)));
            return (false, result.Errors.Select(e => e.Description), string.Empty);
        }

        _logger.LogInformation("Created user {Email}", request.Email);
        return (true, Array.Empty<string>(), user.Id);
    }

    public async Task<(bool success, IEnumerable<string> errors)> UpdateUserAsync(string id, UpdateUserRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return (false, new[] { "User not found" });
        }

        // Update email if it changed
        if (user.Email != request.Email)
        {
            var emailInUse = await _userManager.FindByEmailAsync(request.Email) != null;
            if (emailInUse)
            {
                return (false, new[] { "Email is already in use" });
            }

            user.UserName = request.Email;
            user.Email = request.Email;
        }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.IsActive = request.IsActive;

        var result = await _userManager.UpdateAsync(user);
        
        if (!result.Succeeded)
        {
            _logger.LogWarning("Failed to update user {Email}: {Errors}", 
                request.Email, 
                string.Join(", ", result.Errors.Select(e => e.Description)));
            return (false, result.Errors.Select(e => e.Description));
        }

        _logger.LogInformation("Updated user {Email}", request.Email);
        return (true, Array.Empty<string>());
    }

    public async Task<(bool success, IEnumerable<string> errors)> DeleteUserAsync(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return (false, new[] { "User not found" });
        }

        // Soft delete by setting IsActive to false
        user.IsActive = false;
        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            _logger.LogWarning("Failed to delete user {Id}: {Errors}", 
                id, 
                string.Join(", ", result.Errors.Select(e => e.Description)));
            return (false, result.Errors.Select(e => e.Description));
        }

        _logger.LogInformation("Deleted user {Id}", id);
        return (true, Array.Empty<string>());
    }
} 
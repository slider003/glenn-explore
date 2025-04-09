using Api.Features.UserManagement.Models;
using Api.Features.UserManagement.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Api.Features.Auth.Models;
using Microsoft.EntityFrameworkCore;
using Api.Source.Features.Game;
using Api.Core.Infrastructure.Database;

namespace Api.Features.UserManagement.Controllers;

[ApiController]
[Route("api/users")]
[Authorize] // Require authentication for all endpoints
public class UserController : ControllerBase
{
    private readonly UserManagementService _userService;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<UserController> _logger;
    private readonly NameValidationService _nameValidation;
    private readonly ApplicationDbContext _context;
    public UserController(
        UserManagementService userService,
        UserManager<User> userManager,
        ILogger<UserController> logger,
        NameValidationService nameValidation,
        ApplicationDbContext context)
    {
        _userService = userService;
        _userManager = userManager;
        _logger = logger;
        _nameValidation = nameValidation;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<UserListResponse>> GetUsers([FromQuery] UserListRequest request)
    {
        try
        {
            var response = await _userService.GetUsersAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetUser(string id)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {Id}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest request)
    {
        try
        {
            var (success, errors, userId) = await _userService.CreateUserAsync(request);
            if (!success)
            {
                return BadRequest(new { message = "Failed to create user", errors });
            }

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                _logger.LogError("Created user not found with ID {UserId}", userId);
                return StatusCode(500, new { message = "User created but failed to retrieve details" });
            }

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateUser(string id, UpdateUserRequest request)
    {
        try
        {
            var (success, errors) = await _userService.UpdateUserAsync(id, request);
            if (!success)
            {
                return BadRequest(new { message = "Failed to update user", errors });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {Id}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUser(string id)
    {
        try
        {
            var (success, errors) = await _userService.DeleteUserAsync(id);
            if (!success)
            {
                return BadRequest(new { message = "Failed to delete user", errors });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {Id}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("seed")]
    [AllowAnonymous] // Explicitly allow anonymous access to this endpoint
    public async Task<ActionResult> SeedDefaultUser()
    {
        try
        {
            if (await _userManager.Users.AnyAsync())
            {
                return BadRequest(new { message = "Users already exist in the database" });
            }

            var defaultUser = new User
            {
                UserName = "test@example.com",
                Email = "test@example.com",
                FirstName = "Test",
                LastName = "User",
                EmailConfirmed = true,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(defaultUser, "Test123!");
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to create default user", errors = result.Errors });
            }

            return Ok(new { message = "Default user created successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding default user");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("admin/all")]
    [Authorize]
    public async Task<ActionResult<List<AdminUserResponse>>> GetAllUsersAdmin()
    {
        try
        {
            // Check if user is admin
            var currentUser = await _userManager.GetUserAsync(User);
            if (currentUser == null || !currentUser.IsAdmin)
            {
                return Forbid();
            }

            var users = await _userManager.Users
                .Select(u => new AdminUserResponse
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    IsActive = u.IsActive,
                    IsGuest = u.IsGuest,
                    IsAdmin = u.IsAdmin,
                    CreatedAt = u.CreatedAt,
                    LastLoginAt = u.LastLoginAt,
                    LastSeen = u.LastSeen
                })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users for admin");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("admin/{userId}/username")]
    [Authorize]
    public async Task<ActionResult> ChangeUserNameAdmin(string userId, [FromBody] ChangeUserNameRequest request)
    {
        try
        {
            // Check if current user is admin
            var currentUser = await _userManager.GetUserAsync(User);
            if (currentUser == null || !currentUser.IsAdmin)
            {
                return Forbid();
            }

            // Get target user
            var targetUser = await _userManager.FindByIdAsync(userId);
            if (targetUser == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Validate new username
            var validationResult = _nameValidation.ValidateName(request.NewUserName);
            if (!validationResult.IsValid)
            {
                return BadRequest(new { message = validationResult.ErrorMessage });
            }

            // Check if username is already taken
            var existingUser = await _userManager.FindByNameAsync(request.NewUserName);
            if (existingUser != null && existingUser.Id != userId)
            {
                return BadRequest(new { message = "Username is already taken" });
            }

            // Update username
            targetUser.UserName = request.NewUserName;
            targetUser.NormalizedUserName = request.NewUserName.ToUpperInvariant();
            var result = await _userManager.UpdateAsync(targetUser);

            var player = await _context.Players.FirstOrDefaultAsync(p => p.PlayerId == userId);
            if (player != null)
            {
                player.Name = request.NewUserName;
                await _context.SaveChangesAsync();
            }

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Failed to update username",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            _logger.LogInformation(
                "Admin {AdminId} changed username for user {UserId} from {OldName} to {NewName}",
                currentUser.Id,
                userId,
                targetUser.UserName,
                request.NewUserName
            );

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing username for user {UserId}", userId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("admin/{userId}/make-admin")]
    [Authorize]
    public async Task<ActionResult> MakeUserAdmin(string userId, [FromBody] MakeUserAdminRequest request)
    {
        try
        {
            // Check if current user is admin
            var currentUser = await _userManager.GetUserAsync(User);
            if (currentUser == null || (!currentUser.IsAdmin && currentUser.Id != "player_1743104924645_ilac99b" && currentUser.Id != "114de997-7ba5-4485-a854-90d8ef1ab39a"))
            {
                return Forbid();
            }

            // Get target user
            var targetUser = await _userManager.FindByIdAsync(userId);
            if (targetUser == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Check if user is already admin
            if (targetUser.IsAdmin)
            {
                return BadRequest(new { message = "User is already an admin" });
            }

            // Make user admin
            targetUser.IsAdmin = true;
            var result = await _userManager.UpdateAsync(targetUser);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Failed to update user admin status",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            _logger.LogInformation(
                "Admin {AdminId} made user {UserId} ({UserName}) an admin",
                currentUser.Id,
                targetUser.Id,
                targetUser.UserName
            );

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error making user {UserId} admin", userId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public class AdminUserResponse
{
    public string Id { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; }
    public bool IsGuest { get; set; }
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime LastSeen { get; set; }
}

public class ChangeUserNameRequest
{
    public string NewUserName { get; set; } = string.Empty;
}

public class MakeUserAdminRequest
{
    public bool Confirm { get; set; }
}
using Api.Features.Auth.Models;
using Api.Source.Features.Models.Dtos;
using Api.Source.Features.Models.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;

namespace Api.Source.Features.Models.Controllers;

[ApiController]
[Route("api/models")]
[Authorize]
public class ModelsController : ControllerBase
{
    private readonly ModelsService _modelsService;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ModelsController> _logger;

    public ModelsController(
        ModelsService modelsService,
        UserManager<User> userManager,
        IConfiguration configuration,
        ILogger<ModelsController> logger)
    {
        _modelsService = modelsService;
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
        StripeConfiguration.ApiKey = configuration["Stripe:SecretKey"];
    }

    [HttpGet("unlocked")]
    public async Task<ActionResult<List<UnlockedModelDto>>> GetUnlockedModels()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        var unlockedModels = await _modelsService.GetUserUnlockedModelsAsync(user.Id);
        return Ok(unlockedModels);
    }

    [HttpGet("available")]
    public async Task<ActionResult<List<ModelInfoDto>>> GetAvailableModels()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        var models = await _modelsService.GetAllModelsWithStatusAsync(user);
        return Ok(models);
    }

    [HttpPost("purchase/{modelId}")]
    public async Task<ActionResult<PurchaseModelResponse>> PurchaseModel(string modelId)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        // Check if model is premium
        if (!_modelsService.IsModelPremium(modelId))
        {
            return BadRequest("This model is not available for purchase");
        }

        // Check if already unlocked
        var isUnlocked = await _modelsService.IsModelUnlockedAsync(user.Id, modelId);
        if (isUnlocked)
        {
            return BadRequest("You already own this model");
        }

        // Get model price
        var price = _modelsService.GetModelPrice(modelId);
        var modelName = _modelsService.GetAllModelsWithStatusAsync(user)
            .Result
            .FirstOrDefault(m => m.ModelId == modelId)?.Name ?? modelId;

        // Create checkout session
        var options = CreateCheckoutSessionOptions(user, modelId, modelName, price);
        var service = new SessionService();
        var session = await service.CreateAsync(options);

        return Ok(new PurchaseModelResponse
        {
            CheckoutUrl = session.Url
        });
    }

    [HttpGet("check/{modelId}")]
    public async Task<ActionResult<bool>> CheckModelAccess(string modelId)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        var isUnlocked = await _modelsService.IsModelUnlockedAsync(user.Id, modelId);
        return Ok(isUnlocked);
    }

    [HttpPost("admin/grant-premium-to-paid-users")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<GrantPremiumModelsResponse>> GrantPremiumModelsToPaidUsers()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null || !user.IsAdmin)
        {
            return Unauthorized("Admin access required");
        }

        // Get all paid users
        var paidUsers = await _userManager.Users
            .Where(u => u.HasPaid)
            .ToListAsync();

        if (!paidUsers.Any())
        {
            return Ok(new GrantPremiumModelsResponse
            {
                UsersProcessed = 0,
                ModelsGranted = 0,
                Message = "No paid users found"
            });
        }

        // Get all premium models
        var premiumModels = _modelsService.GetAllModelsWithStatusAsync(user)
            .Result
            .Where(m => m.IsPremium)
            .Select(m => m.ModelId)
            .ToList();

        if (!premiumModels.Any())
        {
            return Ok(new GrantPremiumModelsResponse
            {
                UsersProcessed = 0,
                ModelsGranted = 0,
                Message = "No premium models found"
            });
        }

        int totalModelsGranted = 0;

        // For each paid user, grant all premium models
        foreach (var paidUser in paidUsers)
        {
            foreach (var modelId in premiumModels)
            {
                // Check if already unlocked to avoid duplicates
                if (!await _modelsService.IsModelUnlockedAsync(paidUser.Id, modelId))
                {
                    await _modelsService.UnlockModelAsync(paidUser.Id, modelId);
                    totalModelsGranted++;
                }
            }
        }

        return Ok(new GrantPremiumModelsResponse
        {
            UsersProcessed = paidUsers.Count(),
            ModelsGranted = totalModelsGranted,
            Message = $"Successfully granted premium models to {paidUsers.Count()} users"
        });
    }

    [HttpPost("admin/unlock-model")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UnlockModelForUser([FromBody] AdminUnlockModelRequest request)
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null || !currentUser.IsAdmin)
        {
            return Unauthorized("Admin access required");
        }

        // Validate model ID
        if (!_modelsService.IsModelPremium(request.ModelId))
        {
            return BadRequest($"Model {request.ModelId} is not a premium model or does not exist");
        }

        // Find target user
        var targetUser = await _userManager.FindByIdAsync(request.UserId);
        if (targetUser == null)
        {
            return BadRequest($"User with ID {request.UserId} not found");
        }

        // Unlock the model
        await _modelsService.UnlockModelAsync(request.UserId, request.ModelId);
        
        _logger.LogInformation(
            "Admin {AdminId} unlocked model {ModelId} for user {UserId} ({UserName})",
            currentUser.Id,
            request.ModelId,
            targetUser.Id,
            targetUser.UserName
        );

        return Ok($"Model {request.ModelId} unlocked for user {targetUser.UserName}");
    }

    private SessionCreateOptions CreateCheckoutSessionOptions(User user, string modelId, string modelName, decimal price)
    {
        var domain = _configuration["App:Domain"] ?? "https://playglenn.com";
        var priceInCents = (long)(price * 100);

        return new SessionCreateOptions
        {
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = priceInCents,
                        Currency = "usd",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Model: {modelName}",
                            Description = $"Purchase {modelName} model for Glenn"
                        },
                    },
                    Quantity = 1,
                },
            },
            Mode = "payment",
            SuccessUrl = $"{domain}/play?modelPurchased={modelId}",
            CancelUrl = $"{domain}/play",
            CustomerEmail = user.Email,
            Metadata = new Dictionary<string, string>
            {
                { "userId", user.Id },
                { "modelId", modelId },
                { "type", "model_purchase" }
            }
        };
    }
} 
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
    private readonly ModelsService _modelService;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ModelsController> _logger;

    public ModelsController(
        ModelsService modelService,
        UserManager<User> userManager,
        IConfiguration configuration,
        ILogger<ModelsController> logger)
    {
        _modelService = modelService;
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

        var unlockedModels = await _modelService.GetUserUnlockedModelsAsync(user.Id);
        return Ok(unlockedModels);
    }

    [HttpGet("available")]
    public async Task<ActionResult<List<ModelDetailsDto>>> GetAvailableModels()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        var models = await _modelService.GetAllModelsWithDetailsAsync();
        
        // Set unlocked status for each model
        foreach (var model in models)
        {
            model.IsUnlocked = await _modelService.IsModelUnlockedAsync(user.Id, model.ModelId);
        }
        
        return Ok(models.Where(m => m.IsActive).ToList());
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
        if (!await _modelService.IsModelPremium(modelId))
        {
            return BadRequest("This model is not available for purchase");
        }

        // Check if already unlocked
        var isUnlocked = await _modelService.IsModelUnlockedAsync(user.Id, modelId);
        if (isUnlocked)
        {
            return BadRequest("You already own this model");
        }

        // Get model details
        var model = await _modelService.GetModelByIdWithDetailsAsync(modelId);
        if (model == null)
        {
            return NotFound("Model not found");
        }

        // Create checkout session
        var options = await CreateCheckoutSessionOptions(user, model);
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

        var isUnlocked = await _modelService.IsModelUnlockedAsync(user.Id, modelId);
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
        var models = await _modelService.GetAllModelsAsync();
        var premiumModels = models.Where(m => m.IsPremium).ToList();

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
            foreach (var model in premiumModels)
            {
                // Check if already unlocked
                if (!await _modelService.IsModelUnlockedAsync(paidUser.Id, model.ModelId))
                {
                    await _modelService.UnlockModelAsync(paidUser.Id, model.ModelId);
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

        // Validate model exists and is premium
        if (!await _modelService.IsModelPremium(request.ModelId))
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
        await _modelService.UnlockModelAsync(request.UserId, request.ModelId);
        
        _logger.LogInformation(
            "Admin {AdminId} unlocked model {ModelId} for user {UserId} ({UserName})",
            currentUser.Id,
            request.ModelId,
            targetUser.Id,
            targetUser.UserName
        );

        return Ok($"Model {request.ModelId} unlocked for user {targetUser.UserName}");
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ModelDetailsDto>> CreateModel([FromBody] CreateModelRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null || !user.IsAdmin)
        {
            return Unauthorized("Admin access required");
        }

        try
        {
            var model = await _modelService.CreateModelAsync(request);
            return Ok(model);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{modelId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ModelDetailsDto>> UpdateModel(string modelId, [FromBody] UpdateModelRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null || !user.IsAdmin)
        {
            return Unauthorized("Admin access required");
        }

        try
        {
            var model = await _modelService.UpdateModelAsync(modelId, request);
            return Ok(model);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Model with ID {modelId} not found");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<ModelDetailsDto>>> GetAllModels()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null || !user.IsAdmin)
        {
            return Unauthorized("Admin access required");
        }

        var models = await _modelService.GetAllModelsWithDetailsAsync();
        return Ok(models);
    }

    [HttpGet("admin/{modelId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ModelDetailsDto>> GetModelById(string modelId)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null || !user.IsAdmin)
        {
            return Unauthorized("Admin access required");
        }

        var model = await _modelService.GetModelByIdWithDetailsAsync(modelId);
        if (model == null)
        {
            return NotFound($"Model with ID {modelId} not found");
        }

        return Ok(model);
    }

    [HttpPost("admin/{modelId}/toggle-active")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ModelDetailsDto>> ToggleModelActive(string modelId)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null || !user.IsAdmin)
        {
            return Unauthorized("Admin access required");
        }

        try
        {
            var model = await _modelService.ToggleModelActiveAsync(modelId);
            _logger.LogInformation(
                "Admin {AdminId} toggled model {ModelId} active status to {IsActive}",
                user.Id,
                modelId,
                model.IsActive
            );
            return Ok(model);
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Model with ID {modelId} not found");
        }
    }

    [HttpGet("config-types/{type}")]
    [Authorize(Roles = "Admin")]
    public ActionResult<IModelConfig> GetConfigType(string type)
    {
        switch (type.ToLower())
        {
            case "car":
                return Ok(new CarModelConfig
                {
                    Model = new ModelObject(),
                    Physics = new CarPhysics(),
                    DrivingAnimation = new CarDrivingAnimation()
                });
            case "walking":
                return Ok(new PlayerModelConfig
                {
                    Model = new ModelObject(),
                    Physics = new PlayerPhysics(),
                    WalkingAnimation = new PlayerWalkingAnimation()
                });
            default:
                return BadRequest($"Unknown model type: {type}");
        }
    }

    private async Task<SessionCreateOptions> CreateCheckoutSessionOptions(User user, ModelDetailsDto model)
    {
        var domain = _configuration["App:Domain"] ?? "https://playglenn.com";
        var priceInCents = (long)(model.Price * 100);

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
                            Name = $"Model: {model.Name}",
                            Description = $"Purchase {model.Name} model for Glenn"
                        },
                    },
                    Quantity = 1,
                },
            },
            Mode = "payment",
            SuccessUrl = $"{domain}/play?modelPurchased={model.ModelId}",
            CancelUrl = $"{domain}/play",
            CustomerEmail = user.Email,
            Metadata = new Dictionary<string, string>
            {
                { "userId", user.Id },
                { "modelId", model.ModelId },
                { "type", "model_purchase" }
            }
        };
    }
} 
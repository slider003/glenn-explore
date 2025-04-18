using Microsoft.AspNetCore.Mvc;
using Stripe;
using Api.Features.Auth.Models;
using Api.Source.Features.Models.Services;
using Microsoft.AspNetCore.Identity;
using Stripe.Checkout;

namespace Api.Features.Auth.Payment;

[ApiController]
[Route("api/webhook/stripe")]
public class StripeWebhookController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly ILogger<StripeWebhookController> _logger;
    private readonly string _endpointSecret;
    private readonly ModelsService _modelsService;

    public StripeWebhookController(
        UserManager<User> userManager,
        ILogger<StripeWebhookController> logger,
        IConfiguration configuration,
        ModelsService modelsService)
    {
        _userManager = userManager;
        _logger = logger;
        _endpointSecret = configuration["Stripe:WebhookSecret"] ?? throw new ArgumentNullException("Stripe:WebhookSecret must be configured");
        _modelsService = modelsService;
    }

    [HttpPost]
    public async Task<IActionResult> Index()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"];

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                json,
                signature,
                _endpointSecret
            );

            if (stripeEvent.Type == EventTypes.CheckoutSessionCompleted)
            {
                var session = stripeEvent.Data.Object as Session;
                await HandleCheckoutSessionCompleted(session);
            }
            else
            {
                _logger.LogInformation("Unhandled event type: {0}", stripeEvent.Type);
            }

            return Ok();
        }
        catch (StripeException e)
        {
            _logger.LogError(e, "Stripe webhook error");
            return BadRequest(e.Message);
        }
    }

    private async Task HandleCheckoutSessionCompleted(Session? session)
    {
        if (session == null || !session.Metadata.TryGetValue("userId", out var userId))
        {
            _logger.LogWarning("Invalid session data");
            return;
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("User not found: {UserId}", userId);
            return;
        }

        // Check if this is a model purchase
        if (session.Metadata.TryGetValue("type", out var type) && type == "model_purchase" && 
            session.Metadata.TryGetValue("modelId", out var modelId))
        {
            // This is a model purchase, unlock the model
            await _modelsService.UnlockModelAsync(userId, modelId);
            _logger.LogInformation("Model {ModelId} unlocked for user {UserId}", modelId, userId);
        }
        else
        {
            // This is a general app purchase
            user.MarkAsPaid(session.CustomerId);
            await _userManager.UpdateAsync(user);
            _logger.LogInformation("User {UserId} marked as paid", userId);
        }
    }
} 
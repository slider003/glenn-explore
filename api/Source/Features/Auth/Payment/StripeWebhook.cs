using Microsoft.AspNetCore.Mvc;
using Stripe;
using Api.Features.Auth.Models;
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

    public StripeWebhookController(
        UserManager<User> userManager,
        ILogger<StripeWebhookController> logger,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _logger = logger;
        _endpointSecret = configuration["Stripe:WebhookSecret"] ?? throw new ArgumentNullException("Stripe:WebhookSecret must be configured");
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

        user.MarkAsPaid(session.CustomerId);
        await _userManager.UpdateAsync(user);
        
        _logger.LogInformation("User {UserId} marked as paid", userId);
    }
} 
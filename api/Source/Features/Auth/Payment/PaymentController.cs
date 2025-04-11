using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Api.Features.Auth.Models;
using Microsoft.AspNetCore.Identity;
using Stripe;
using Stripe.Checkout;

namespace Api.Features.Auth.Payment;

[ApiController]
[Route("api/payment")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly PaymentService _paymentService;

    public PaymentController(
        UserManager<User> userManager,
        IConfiguration configuration,
        PaymentService paymentService)
    {
        _userManager = userManager;
        _configuration = configuration;
        _paymentService = paymentService;
        StripeConfiguration.ApiKey = configuration["Stripe:SecretKey"];
    }

    [HttpPost("create-checkout-session")]
    public async Task<IActionResult> CreateCheckoutSession()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        if (user.HasPaid)
        {
            return BadRequest("User has already paid");
        }

        var domain = _configuration["App:Domain"] ?? "https://playglenn.com";
        
        var options = new SessionCreateOptions
        {
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = 100, // $1.00
                        Currency = "usd",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = "Glenn Access",
                            Description = "One-time payment for access to Glenn"
                        },
                    },
                    Quantity = 1,
                },
            },
            Mode = "payment",
            SuccessUrl = $"{domain}/payment-success",
            CancelUrl = $"{domain}/payment-cancel",
            CustomerEmail = user.Email,
            Metadata = new Dictionary<string, string>
            {
                { "userId", user.Id }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);

        return Ok(new { url = session.Url });
    }
} 
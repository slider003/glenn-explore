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
                        UnitAmount = 99, // $1.00
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
            SuccessUrl = $"{domain}/play",
            CancelUrl = $"{domain}/play",
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
    
    [HttpPost("admin/create-custom-checkout")]
    public async Task<IActionResult> CreateAdminCustomCheckout([FromBody] AdminCustomCheckoutRequest request)
    {
        // Check if current user is admin
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null || !currentUser.IsAdmin)
        {
            return Forbid();
        }
        
        // Validate request
        if (request.UnitAmount <= 0)
        {
            return BadRequest(new { message = "Unit amount must be greater than 0" });
        }
        
        if (string.IsNullOrWhiteSpace(request.CustomerEmail))
        {
            return BadRequest(new { message = "Customer email is required" });
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
                        UnitAmount = request.UnitAmount,
                        Currency = "usd",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = "Custom Purchase",
                            Description = request.ProductDescription ?? "Custom one-time payment"
                        },
                    },
                    Quantity = 1,
                },
            },
            Mode = "payment",
            SuccessUrl = $"{domain}/payment-success",
            CancelUrl = $"{domain}/payment-cancel",
            CustomerEmail = request.CustomerEmail,
            Metadata = new Dictionary<string, string>
            {
                { "initiatedBy", currentUser.Id },
                { "isCustomPayment", "true" }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);

        return Ok(new { url = session.Url });
    }
} 

public class AdminCustomCheckoutRequest
{
    public long UnitAmount { get; set; }
    public string CustomerEmail { get; set; } = string.Empty;
    public string? ProductDescription { get; set; }
} 
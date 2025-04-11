using Stripe;
using Api.Features.Auth.Models;
using Microsoft.Extensions.Configuration;

namespace Api.Features.Auth.Payment;

public class PaymentService
{
    private readonly string _stripeSecretKey;
    private readonly string _stripeWebhookSecret;
    
    public PaymentService(IConfiguration configuration)
    {
        _stripeSecretKey = configuration["Stripe:SecretKey"] ?? throw new ArgumentNullException("Stripe:SecretKey must be configured");
        _stripeWebhookSecret = configuration["Stripe:WebhookSecret"] ?? throw new ArgumentNullException("Stripe:WebhookSecret must be configured");
        StripeConfiguration.ApiKey = _stripeSecretKey;
    }

    public async Task<PaymentIntent> CreatePaymentIntent(User user)
    {
        var options = new PaymentIntentCreateOptions
        {
            Amount = 100, // $1.00 in cents
            Currency = "usd",
            Customer = user.StripeCustomerId,
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true,
            },
            Metadata = new Dictionary<string, string>
            {
                { "userId", user.Id }
            }
        };

        var service = new PaymentIntentService();
        return await service.CreateAsync(options);
    }

    public async Task<Customer> CreateOrGetCustomer(User user)
    {
        if (!string.IsNullOrEmpty(user.StripeCustomerId))
        {
            var customerService = new CustomerService();
            return await customerService.GetAsync(user.StripeCustomerId);
        }

        var options = new CustomerCreateOptions
        {
            Email = user.Email,
            Metadata = new Dictionary<string, string>
            {
                { "userId", user.Id }
            }
        };

        var service = new CustomerService();
        return await service.CreateAsync(options);
    }

    public bool ValidateWebhookSignature(string requestBody, string signatureHeader)
    {
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                requestBody,
                signatureHeader,
                _stripeWebhookSecret
            );

            return true;
        }
        catch (StripeException)
        {
            return false;
        }
    }
} 
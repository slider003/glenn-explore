using System;
using System.Threading.Tasks;
using Api.Source.Features.Email.Models;
using Microsoft.Extensions.Logging;
using Resend;

namespace Api.Source.Features.Email.Services
{
    public class ResendEmailService
    {
        private readonly ILogger<ResendEmailService> _logger;
        private readonly IResend _resendClient;

        public ResendEmailService(
            ILogger<ResendEmailService> logger, 
            IResend resendClient)
        {
            _logger = logger;
            _resendClient = resendClient;
        }

        public async Task<EmailSendResult> SendEmailAsync(EmailSendRequest request)
        {
            try
            {
                _logger.LogInformation("Sending email to {Recipient}", request.To);
                
                var message = new EmailMessage
                {
                    From = request.From,
                    Subject = request.Subject,
                    HtmlBody = request.HtmlBody,
                    TextBody = request.PlainTextBody
                };
                
                message.To.Add(request.To);

                var result = await _resendClient.EmailSendAsync(message);
                
                if (result != null)
                {
                    var messageId = result.ToString();
                    _logger.LogInformation("Email sent successfully with ID: {MessageId}", messageId);
                    return new EmailSendResult
                    {
                        Success = true,
                        MessageId = messageId
                    };
                }
                else
                {
                    _logger.LogWarning("Failed to send email: No message ID returned");
                    return new EmailSendResult
                    {
                        Success = false,
                        ErrorMessage = "No message ID returned"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email to {Recipient}", request.To);
                return new EmailSendResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }
    }
} 
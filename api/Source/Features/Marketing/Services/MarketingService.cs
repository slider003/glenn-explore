using Api.Core.Infrastructure.Database;
using Api.Features.Auth.Models;
using Api.Source.Features.Marketing.Models;
using Microsoft.EntityFrameworkCore;
using Api.Source.Features.Email.Models;
using Api.Source.Features.Email.Services;

namespace Api.Source.Features.Marketing.Services;

public class MarketingService
{
    private readonly ApplicationDbContext _context;
    private readonly ResendEmailService _emailService;
    private readonly ILogger<MarketingService> _logger;

    public MarketingService(
        ApplicationDbContext context,
        ResendEmailService emailService,
        ILogger<MarketingService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    // Template operations
    public async Task<EmailTemplate> CreateTemplate(EmailTemplate template)
    {
        _context.EmailTemplates.Add(template);
        await _context.SaveChangesAsync();
        return template;
    }

    public async Task<List<EmailTemplate>> GetTemplates()
    {
        return await _context.EmailTemplates
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<EmailTemplate?> GetTemplate(string id)
    {
        return await _context.EmailTemplates.FindAsync(id);
    }

    public async Task<EmailTemplate> UpdateTemplate(string id, EmailTemplate template)
    {
        var existing = await _context.EmailTemplates.FindAsync(id)
            ?? throw new KeyNotFoundException($"Template with ID {id} not found");

        existing.Name = template.Name;
        existing.Subject = template.Subject;
        existing.HtmlContent = template.HtmlContent;
        existing.TextContent = template.TextContent;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteTemplate(string id)
    {
        var template = await _context.EmailTemplates.FindAsync(id)
            ?? throw new KeyNotFoundException($"Template with ID {id} not found");

        _context.EmailTemplates.Remove(template);
        await _context.SaveChangesAsync();
    }

    // Campaign operations
    public async Task<Campaign> AddRecipientsToCampaign(string campaignId, List<string> userIds)
    {
        var campaign = await _context.Campaigns
            .Include(c => c.Recipients)
            .Include(c => c.EmailTemplate)
            .FirstOrDefaultAsync(c => c.Id == campaignId);

        if (campaign == null)
        {
            throw new KeyNotFoundException($"Campaign with id {campaignId} not found");
        }

        var users = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync();

        foreach (var user in users)
        {
            if (!campaign.Recipients.Any(r => r.Email == user.Email))
            {
                campaign.Recipients.Add(new CampaignRecipient
                {
                    UserId = user.Id,
                    Email = user.Email,
                    Status = "pending",
                    LastSeenBefore = user.LastSeen,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        campaign.TotalRecipients = campaign.Recipients.Count;
        await _context.SaveChangesAsync();

        return campaign;
    }

    public async Task<Campaign> CreateCampaign(Campaign campaign, List<string> userIds)
    {
        // Validate template exists
        var template = await _context.EmailTemplates.FindAsync(campaign.EmailTemplateId)
            ?? throw new KeyNotFoundException($"Template with ID {campaign.EmailTemplateId} not found");

        // Get users and create recipients
        var users = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync();

        campaign.Recipients = users.Select(user => new CampaignRecipient
        {
            UserId = user.Id,
            Email = user.Email!,
            LastSeenBefore = user.LastSeen
        }).ToList();

        campaign.TotalRecipients = campaign.Recipients.Count;
        
        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();
        return campaign;
    }

    public async Task<List<Campaign>> GetCampaigns()
    {
        return await _context.Campaigns
            .Include(c => c.EmailTemplate)
            .Include(c => c.Recipients)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<Campaign?> GetCampaign(string id)
    {
        return await _context.Campaigns
            .Include(c => c.EmailTemplate)
            .Include(c => c.Recipients)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Campaign> UpdateCampaign(string id, Campaign campaign)
    {
        var existing = await _context.Campaigns.FindAsync(id)
            ?? throw new KeyNotFoundException($"Campaign with ID {id} not found");

        existing.Name = campaign.Name;
        existing.Description = campaign.Description;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteCampaign(string id)
    {
        var campaign = await _context.Campaigns.FindAsync(id)
            ?? throw new KeyNotFoundException($"Campaign with ID {id} not found");

        _context.Campaigns.Remove(campaign);
        await _context.SaveChangesAsync();
    }

    // Campaign recipient operations
    public async Task<List<CampaignRecipient>> GetCampaignRecipients(string campaignId)
    {
        return await _context.CampaignRecipients
            .Include(cr => cr.User)
            .Where(cr => cr.CampaignId == campaignId)
            .OrderBy(cr => cr.CreatedAt)
            .ToListAsync();
    }

    public async Task<CampaignRecipient?> GetCampaignRecipient(string id)
    {
        return await _context.CampaignRecipients
            .Include(cr => cr.Campaign)
            .ThenInclude(c => c!.EmailTemplate)
            .Include(cr => cr.User)
            .FirstOrDefaultAsync(cr => cr.Id == id);
    }

    public async Task<bool> SendEmailToRecipient(string recipientId)
    {
        var recipient = await GetCampaignRecipient(recipientId)
            ?? throw new KeyNotFoundException($"Recipient with ID {recipientId} not found");

        if (recipient.Status != "pending")
        {
            throw new InvalidOperationException($"Cannot send email to recipient with status {recipient.Status}");
        }

        try
        {
            var template = recipient.Campaign?.EmailTemplate
                ?? throw new InvalidOperationException("Campaign or template not found");

            var result = await _emailService.SendEmailAsync(new EmailSendRequest
            {
                From = "Glenn <glenn@playglenn.com>",
                To = recipient.Email,
                Subject = template.Subject,
                HtmlBody = template.HtmlContent,
                PlainTextBody = template.TextContent
            });

            if (result.Success)
            {
                recipient.Status = "sent";
                recipient.SentAt = DateTime.UtcNow;

                // Update campaign stats
                if (recipient.Campaign != null)
                {
                    recipient.Campaign.SentCount++;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            
            recipient.Status = "failed";
            recipient.ErrorMessage = result.ErrorMessage;
            await _context.SaveChangesAsync();
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to recipient {RecipientId}", recipientId);
            
            recipient.Status = "failed";
            recipient.ErrorMessage = ex.Message;
            await _context.SaveChangesAsync();
            
            return false;
        }
    }
}

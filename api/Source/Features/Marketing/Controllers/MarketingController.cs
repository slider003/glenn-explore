using Api.Source.Features.Marketing.Models;
using Api.Source.Features.Marketing.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Source.Features.Marketing.Controllers;

[ApiController]
[Route("api/marketing")]
[Authorize(Roles = "Admin")]
public class MarketingController : ControllerBase
{
    private readonly MarketingService _marketingService;
    private readonly ILogger<MarketingController> _logger;

    public MarketingController(
        MarketingService marketingService,
        ILogger<MarketingController> logger)
    {
        _marketingService = marketingService;
        _logger = logger;
    }

    // Template endpoints
    [HttpGet("templates")]
    public async Task<ActionResult<List<EmailTemplate>>> GetTemplates()
    {
        return await _marketingService.GetTemplates();
    }

    [HttpGet("templates/{id}")]
    public async Task<ActionResult<EmailTemplate>> GetTemplate(string id)
    {
        var template = await _marketingService.GetTemplate(id);
        if (template == null)
        {
            return NotFound();
        }
        return template;
    }

    [HttpPost("templates")]
    public async Task<ActionResult<EmailTemplate>> CreateTemplate(EmailTemplate template)
    {
        template.CreatedBy = User.Identity?.Name ?? "unknown";
        var created = await _marketingService.CreateTemplate(template);
        return CreatedAtAction(nameof(GetTemplate), new { id = created.Id }, created);
    }

    [HttpPut("templates/{id}")]
    public async Task<ActionResult<EmailTemplate>> UpdateTemplate(string id, EmailTemplate template)
    {
        try
        {
            return await _marketingService.UpdateTemplate(id, template);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("templates/{id}")]
    public async Task<IActionResult> DeleteTemplate(string id)
    {
        try
        {
            await _marketingService.DeleteTemplate(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // Campaign endpoints
    [HttpGet("campaigns")]
    public async Task<ActionResult<List<Campaign>>> GetCampaigns()
    {
        var campaigns = await _marketingService.GetCampaigns();
        return campaigns;
    }

    [HttpGet("campaigns/{id}")]
    public async Task<ActionResult<Campaign>> GetCampaign(string id)
    {
        var campaign = await _marketingService.GetCampaign(id);
        if (campaign == null)
        {
            return NotFound();
        }

       return campaign;
    }

    [HttpPost("campaigns")]
    public async Task<ActionResult<Campaign>> CreateCampaign(CreateCampaignRequest request)
    {
        var campaign = new Campaign
        {
            Name = request.Name,
            Description = request.Description,
            EmailTemplateId = request.EmailTemplateId,
            CreatedBy = User.Identity?.Name ?? "unknown"
        };

        var created = await _marketingService.CreateCampaign(campaign, request.UserIds);
        return CreatedAtAction(nameof(GetCampaign), new { id = created.Id }, created);
    }

    [HttpPut("campaigns/{id}")]
    public async Task<ActionResult<Campaign>> UpdateCampaign(string id, Campaign campaign)
    {
        try
        {
            return await _marketingService.UpdateCampaign(id, campaign);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("campaigns/{id}")]
    public async Task<IActionResult> DeleteCampaign(string id)
    {
        try
        {
            await _marketingService.DeleteCampaign(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // Campaign recipient endpoints
    [HttpGet("campaigns/{campaignId}/recipients")]
    public async Task<ActionResult<List<CampaignRecipient>>> GetCampaignRecipients(string campaignId)
    {
        return await _marketingService.GetCampaignRecipients(campaignId);
    }

    [HttpPost("campaigns/{id}/recipients")]
    public async Task<ActionResult<Campaign>> AddRecipients(string id, AddRecipientsRequest request)
    {
        try
        {
            var campaign = await _marketingService.AddRecipientsToCampaign(id, request.UserIds);
            return Ok(campaign);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("recipients/{id}/send")]
    public async Task<IActionResult> SendEmailToRecipient(string id)
    {
        try
        {
            var success = await _marketingService.SendEmailToRecipient(id);
            if (success)
            {
                return Ok();
            }
            return BadRequest("Failed to send email");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [AllowAnonymous]
    [HttpGet("unsubscribe/{encodedUserId}")]
    public async Task<IActionResult> Unsubscribe(string encodedUserId)
    {
        try
        {
            var userId = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(encodedUserId));
            await _marketingService.UnsubscribeUser(userId);
            return Ok("You have been successfully unsubscribed from our emails.");
        }
        catch (Exception ex)
        {
            return BadRequest("Invalid unsubscribe link");
        }
    }
}

public class CreateCampaignRequest
{
    public required string Name { get; set; }
    public string Description { get; set; } = string.Empty;
    public required string EmailTemplateId { get; set; }
    public required List<string> UserIds { get; set; }
}

public class AddRecipientsRequest
{
    public required List<string> UserIds { get; set; }
}

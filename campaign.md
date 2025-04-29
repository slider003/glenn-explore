# Email Marketing Campaign System Implementation Plan

## Overview
This document outlines the step-by-step implementation of an email marketing system for Glenn Explore's studio-web. The system will allow administrators to create campaigns with predefined email lists and track engagement metrics.

## Core Components

### Backend Components
- Campaign management
- Email template system
- Email queue processing
- Campaign analytics

### Frontend Components (Studio Web)
- Campaign creation interface
- Template editor
- Campaign monitoring dashboard
- Analytics reporting

## Implementation Plan

### Phase 1: Backend Implementation

#### Step 1: Database Schema
Create the following models:
- EmailTemplate
- Campaign
- CampaignRecipient
- CampaignStatistics

```csharp
// Email Template
public class EmailTemplate
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public string TextContent { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// Campaign
public class Campaign
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string EmailTemplateId { get; set; } = string.Empty;
    public string Status { get; set; } = "draft"; // draft, sending, paused, completed, canceled
    public int TotalRecipients { get; set; } = 0;
    public int SentCount { get; set; } = 0;
    public int OpenCount { get; set; } = 0;
    public int ErrorCount { get; set; } = 0;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
}

// Campaign Recipient
public class CampaignRecipient
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string CampaignId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Status { get; set; } = "pending"; // pending, sent, opened, failed
    public DateTime? SentAt { get; set; }
    public DateTime? OpenedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? LastSeenBefore { get; set; }
    public DateTime? LastSeenAfter { get; set; }
}
```

#### Step 2: Services Implementation

1. **Email Template Service**
```csharp
public interface IEmailTemplateService
{
    Task<EmailTemplate> CreateTemplate(EmailTemplate template);
    Task<EmailTemplate> GetTemplate(string id);
    Task<List<EmailTemplate>> GetAllTemplates();
    Task<EmailTemplate> UpdateTemplate(EmailTemplate template);
    Task DeleteTemplate(string id);
}
```

2. **Campaign Service**
```csharp
public interface ICampaignService
{
    Task<Campaign> CreateCampaign(Campaign campaign, List<string> userIds);
    Task<Campaign> GetCampaign(string id);
    Task<List<Campaign>> GetAllCampaigns();
    Task<Campaign> UpdateCampaign(Campaign campaign);
    Task<Campaign> StartCampaign(string id);
    Task<Campaign> PauseCampaign(string id);
    Task<Campaign> ResumeCampaign(string id);
    Task<Campaign> CancelCampaign(string id);
    Task<List<CampaignRecipient>> GetCampaignRecipients(string campaignId);
    Task<CampaignRecipient> GetNextRecipientToProcess(string campaignId);
    Task MarkRecipientAsProcessed(string recipientId, bool success, string errorMessage = null);
    Task UpdateCampaignStatistics(string campaignId);
}
```

3. **Email Sender Background Service**
```csharp
public class EmailSenderBackgroundService : BackgroundService
{
    private readonly ICampaignService _campaignService;
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailSenderBackgroundService> _logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Get active campaigns
                var activeCampaigns = await _campaignService.GetActiveCampaigns();
                
                foreach (var campaign in activeCampaigns)
                {
                    // Get next recipient for this campaign
                    var recipient = await _campaignService.GetNextRecipientToProcess(campaign.Id);
                    
                    if (recipient != null)
                    {
                        try
                        {
                            // Send email
                            await _emailService.SendCampaignEmail(campaign, recipient);
                            
                            // Mark as sent
                            await _campaignService.MarkRecipientAsProcessed(recipient.Id, true);
                            
                            // Update campaign statistics
                            await _campaignService.UpdateCampaignStatistics(campaign.Id);
                        }
                        catch (Exception ex)
                        {
                            // Log error and mark as failed
                            _logger.LogError(ex, "Failed to send email to {Email}", recipient.Email);
                            await _campaignService.MarkRecipientAsProcessed(recipient.Id, false, ex.Message);
                        }
                    }
                    
                    // Check if campaign is completed
                    await _campaignService.CheckCampaignCompletion(campaign.Id);
                }
                
                // Rate limit: one email per second
                await Task.Delay(1000, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in email sender background service");
                await Task.Delay(5000, stoppingToken);
            }
        }
    }
}
```

#### Step 3: API Endpoints

Create the following endpoints in `CampaignController.cs`:

```csharp
[ApiController]
[Route("api/campaigns")]
public class CampaignController : ControllerBase
{
    // Email Templates
    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates();
    
    [HttpGet("templates/{id}")]
    public async Task<IActionResult> GetTemplate(string id);
    
    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] EmailTemplate template);
    
    [HttpPut("templates/{id}")]
    public async Task<IActionResult> UpdateTemplate(string id, [FromBody] EmailTemplate template);
    
    [HttpDelete("templates/{id}")]
    public async Task<IActionResult> DeleteTemplate(string id);
    
    // Campaigns
    [HttpGet]
    public async Task<IActionResult> GetCampaigns();
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCampaign(string id);
    
    [HttpPost]
    public async Task<IActionResult> CreateCampaign([FromBody] CampaignCreationDto dto);
    
    [HttpGet("{id}/recipients")]
    public async Task<IActionResult> GetCampaignRecipients(string id);
    
    [HttpPost("{id}/start")]
    public async Task<IActionResult> StartCampaign(string id);
    
    [HttpPost("{id}/pause")]
    public async Task<IActionResult> PauseCampaign(string id);
    
    [HttpPost("{id}/resume")]
    public async Task<IActionResult> ResumeCampaign(string id);
    
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelCampaign(string id);
    
    [HttpGet("{id}/statistics")]
    public async Task<IActionResult> GetCampaignStatistics(string id);
}
```

#### Step 4: Email Tracking Implementation

1. Add tracking pixel to the email template
2. Create endpoint for tracking email opens
3. Implement tracking logic to update CampaignRecipient status

```csharp
[HttpGet("track/{recipientId}")]
public async Task<IActionResult> TrackEmailOpen(string recipientId)
{
    // Update recipient as opened
    await _campaignService.MarkRecipientAsOpened(recipientId);
    
    // Return a 1x1 transparent pixel
    return File(new byte[] { 0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3B }, "image/gif");
}
```

### Phase 2: Frontend Implementation (Studio Web)

#### Step 1: State Management
Create Zustand store for campaigns:

```typescript
// campaignStore.ts
import create from 'zustand';
import { Campaign, EmailTemplate, CampaignRecipient } from '../types';
import { api } from '../../api';

interface CampaignState {
  campaigns: Campaign[];
  templates: EmailTemplate[];
  loading: boolean;
  error: string | null;
  fetchCampaigns: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  createCampaign: (campaign: Campaign, userIds: string[]) => Promise<void>;
  startCampaign: (id: string) => Promise<void>;
  pauseCampaign: (id: string) => Promise<void>;
  resumeCampaign: (id: string) => Promise<void>;
  cancelCampaign: (id: string) => Promise<void>;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  templates: [],
  loading: false,
  error: null,
  
  fetchCampaigns: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/campaigns');
      set({ campaigns: response.data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch campaigns', loading: false });
    }
  },
  
  fetchTemplates: async () => {
    // Implementation
  },
  
  createCampaign: async (campaign, userIds) => {
    // Implementation
  },
  
  startCampaign: async (id) => {
    // Implementation
  },
  
  // Additional methods...
}));
```

#### Step 2: Component Implementation

1. **CampaignsPage.tsx**
   - List of campaigns with status, sent count, and open count
   - Actions for viewing, pausing, resuming, and canceling campaigns

2. **CampaignDetailsPage.tsx**
   - Detailed view of campaign
   - Progress tracking
   - Recipient status table
   - Action buttons for controlling campaign

3. **TemplateEditorPage.tsx**
   - Form for creating/editing templates
   - HTML editor for email content
   - Preview functionality

4. **RecipientSelectorComponent.tsx**
   - User selection interface
   - Search functionality
   - Bulk selection tools

#### Step 3: API Integration
Create API service for interacting with the backend:

```typescript
// campaignApi.ts
import axios from 'axios';
import { Campaign, EmailTemplate, CampaignRecipient } from '../types';

const API_URL = '/api';

export const campaignApi = {
  // Templates
  getTemplates: () => axios.get(`${API_URL}/campaigns/templates`),
  getTemplate: (id: string) => axios.get(`${API_URL}/campaigns/templates/${id}`),
  createTemplate: (template: EmailTemplate) => axios.post(`${API_URL}/campaigns/templates`, template),
  updateTemplate: (template: EmailTemplate) => axios.put(`${API_URL}/campaigns/templates/${template.id}`, template),
  deleteTemplate: (id: string) => axios.delete(`${API_URL}/campaigns/templates/${id}`),
  
  // Campaigns
  getCampaigns: () => axios.get(`${API_URL}/campaigns`),
  getCampaign: (id: string) => axios.get(`${API_URL}/campaigns/${id}`),
  createCampaign: (campaign: Campaign, userIds: string[]) => 
    axios.post(`${API_URL}/campaigns`, { campaign, userIds }),
  getCampaignRecipients: (id: string) => axios.get(`${API_URL}/campaigns/${id}/recipients`),
  
  // Campaign Actions
  startCampaign: (id: string) => axios.post(`${API_URL}/campaigns/${id}/start`),
  pauseCampaign: (id: string) => axios.post(`${API_URL}/campaigns/${id}/pause`),
  resumeCampaign: (id: string) => axios.post(`${API_URL}/campaigns/${id}/resume`),
  cancelCampaign: (id: string) => axios.post(`${API_URL}/campaigns/${id}/cancel`),
  
  // Statistics
  getCampaignStatistics: (id: string) => axios.get(`${API_URL}/campaigns/${id}/statistics`),
};
```

### Phase 3: Integration Testing

#### Step 1: Backend Testing
1. Test template creation and management
2. Test campaign creation
3. Test email sending process
4. Test tracking functionality

#### Step 2: Frontend Testing
1. Test campaign creation flow
2. Test template editor
3. Test campaign management (pause, resume, cancel)
4. Test statistics display

### Phase 4: Deployment

1. Add database migrations
2. Update API documentation
3. Ensure background service is properly registered
4. Deploy frontend changes
5. Test end-to-end flow in production environment

## Future Enhancements

1. Add template variables ({{user.FirstName}}, etc.)
2. Implement email scheduling
3. Add more advanced recipient filtering
4. Implement A/B testing
5. Enhance analytics with click tracking
6. Add email delivery reports

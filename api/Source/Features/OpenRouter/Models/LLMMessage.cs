using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Features.OpenRouter.Models;

[Table("LLMMessages")]
public class LLMMessage
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public string ConversationId { get; set; } = null!;
    
    [Required]
    public string Role { get; set; } = null!;  // system/user/assistant/tool
    
    [Required]
    public string Content { get; set; } = null!;
    
    public string? ToolName { get; set; }
    
    public string? ToolResponse { get; set; }
    
    public DateTime SentAt { get; set; }

    // Factory methods for easy creation
    public static LLMMessage FromUser(string conversationId, string content)
    {
        return new LLMMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            Role = "user",
            Content = content,
            SentAt = DateTime.UtcNow
        };
    }

    public static LLMMessage FromAssistant(string conversationId, string content)
    {
        return new LLMMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            Role = "assistant",
            Content = content,
            SentAt = DateTime.UtcNow
        };
    }

    public static LLMMessage FromTool(string conversationId, string toolName, string content, string response)
    {
        return new LLMMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            Role = "tool",
            Content = content,
            ToolName = toolName,
            ToolResponse = response,
            SentAt = DateTime.UtcNow
        };
    }

    public static LLMMessage FromSystem(string conversationId, string content)
    {
        return new LLMMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            Role = "system",
            Content = content,
            SentAt = DateTime.UtcNow
        };
    }
} 
using Api.Features.OpenRouter.Tools;
using Api.Features.OpenRouter.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Collections.Concurrent;
using Api.Features.OpenRouter.Services;

namespace Api.Features.OpenRouter.Controllers
{
    [ApiController]
    [Route("api/openrouter/tools")]
    public class OpenRouterToolsController : ControllerBase, IDisposable
    {
        private readonly ILogger<OpenRouterToolsController> _logger;
        private readonly IConfiguration _configuration;
        private readonly SampleTools _sampleTools;
        private readonly HttpClient _httpClient;
        private readonly LLMMessagePersistenceService _llmPersistence;

        private static readonly ConcurrentDictionary<string, Conversation> _conversations = new();
        private static readonly TimeSpan _conversationTimeout = TimeSpan.FromHours(1); // Configurable timeout
        private static readonly Timer _cleanupTimer;

        private const int MAX_MESSAGE_LENGTH = 500; // Maximum characters per message
        private const int MAX_MESSAGES_PER_CONVERSATION = 50; // Maximum messages in conversation history
        private const int RATE_LIMIT_SECONDS = 3; // Minimum seconds between messages

        static OpenRouterToolsController()
        {
            // Run cleanup every 15 minutes
            _cleanupTimer = new Timer(CleanupOldConversations, null, TimeSpan.Zero, TimeSpan.FromMinutes(15));
        }

        private class Conversation
        {
            public List<Message> Messages { get; set; } = new();
            public DateTime LastAccessed { get; set; }
            public DateTime LastMessageTime { get; set; } // For rate limiting
        }

        public OpenRouterToolsController(
            ILogger<OpenRouterToolsController> logger,
            IConfiguration configuration,
            LLMMessagePersistenceService llmPersistence)
        {
            _logger = logger;
            _configuration = configuration;
            _sampleTools = new SampleTools();
            _httpClient = new HttpClient();
            _llmPersistence = llmPersistence;
        }

        [HttpGet("conversations/{conversationId}")]
        public async Task<IActionResult> GetConversation([FromRoute] string conversationId)
        {
            if (_conversations.TryGetValue(conversationId, out var conversation))
            {
                UpdateConversationAccess(conversationId);
                return Ok(conversation.Messages.Where(m => m.Role != "system").ToList());
            }
            
            return Ok(new List<Message>()); // Return empty list for new conversations
        }

        public static List<OpenRouterModel> CachedModels { get; set; } = new List<OpenRouterModel>();

        /// <summary>
        /// Get available models from OpenRouter with caching
        /// </summary>
        [HttpGet("models")]
        public async Task<IActionResult> GetModels()
        {
            try
            {
                // Check if models are in cache
                if (CachedModels.Count > 0)
                {
                    return Ok(CachedModels);
                }


                // Fetch models from OpenRouter API
                using var request = new HttpRequestMessage(HttpMethod.Get, "https://openrouter.ai/api/v1/models");
                var response = await _httpClient.SendAsync(request);

                // Read the raw response content
                var content = await response.Content.ReadAsStringAsync();

       
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to fetch models from OpenRouter API. Status: {Status}, Content: {Content}",
                        response.StatusCode, content);
                    return StatusCode((int)response.StatusCode, $"Error from OpenRouter API: {content}");
                }

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var modelsResponse = JsonSerializer.Deserialize<ModelsResponse>(content, options);

                if (modelsResponse?.Data == null)
                {
                    _logger.LogError("Invalid response structure from OpenRouter API");
                    return StatusCode(500, "Invalid response from OpenRouter API");
                }

                _logger.LogInformation("Successfully deserialized {Count} models from OpenRouter",
                    modelsResponse.Data.Count);

                // Filter to models that support tools
                var models = modelsResponse.Data.ToList();


                // Log details of each model that supports tools
                foreach (var model in models)
                {
                    _logger.LogInformation("Tool-capable model: {ModelId}, Name: {ModelName}, Context: {ContextLength}, Features: {Features}",
                        model.Id, model.Name, model.ContextLength, string.Join(", ", model.Features));
                }

                // Store in cache
                CachedModels = models;

                return Ok(models);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching models from OpenRouter");
                return StatusCode(500, $"Error fetching models: {ex.Message}");
            }
        }

        [HttpGet("chat/stream")]
        public async Task ChatWithToolsStream(
            [FromQuery] string conversationId,
            [FromQuery] string message,
            CancellationToken cancellationToken)
        {
            try
            {
                // Input validation
                if (string.IsNullOrWhiteSpace(message))
                {
                    await WriteErrorEvent("Message cannot be empty");
                    return;
                }

                if (message.Length > MAX_MESSAGE_LENGTH)
                {
                    await WriteErrorEvent($"Message too long. Maximum length is {MAX_MESSAGE_LENGTH} characters");
                    return;
                }

                // Sanitize input - remove any control characters
                message = new string(message.Where(c => !char.IsControl(c)).ToArray());

                var conversation = GetOrCreateConversation(conversationId);

                // Queue the user message for persistence
                _llmPersistence.QueueMessage(LLMMessage.FromUser(
                    conversationId: conversationId,
                    content: message
                ));

                // Rate limiting check
                var timeSinceLastMessage = DateTime.UtcNow - conversation.LastMessageTime;
                if (timeSinceLastMessage.TotalSeconds < RATE_LIMIT_SECONDS)
                {
                    await WriteErrorEvent($"Please wait {RATE_LIMIT_SECONDS - (int)timeSinceLastMessage.TotalSeconds} seconds before sending another message");
                    return;
                }

                // Check conversation size
                if (conversation.Messages.Count >= MAX_MESSAGES_PER_CONVERSATION)
                {
                    // Remove oldest non-system messages to make room
                    var nonSystemMessages = conversation.Messages
                        .Where(m => m.Role != "system")
                        .OrderBy(m => conversation.Messages.IndexOf(m))
                        .Take(conversation.Messages.Count - MAX_MESSAGES_PER_CONVERSATION + 1)
                        .ToList();

                    foreach (var oldMessage in nonSystemMessages)
                    {
                        conversation.Messages.Remove(oldMessage);
                    }

                    _logger.LogInformation("Trimmed conversation {ConversationId} history to maintain size limit", conversationId);
                }

                // Update rate limit timestamp
                conversation.LastMessageTime = DateTime.UtcNow;

                var model = "google/gemini-2.0-flash-001";

                // Set content type for SSE
                Response.ContentType = "text/event-stream";
                Response.Headers.Add("Cache-Control", "no-cache");
                Response.Headers.Add("Connection", "keep-alive");

                // Get API key from configuration
                var apiKey = Environment.GetEnvironmentVariable("OPENROUTER_API_KEY") ?? _configuration["OpenRouter:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    await WriteErrorEvent("OpenRouter API key not configured");
                    return;
                }

                // Validate model ID
                if (string.IsNullOrEmpty(model))
                {
                    await WriteErrorEvent("Model ID is required");
                    return;
                }

                // Create client
                var client = new OpenRouterClient(
                    apiKey,
                    _configuration["OpenRouter:SiteUrl"],
                    _configuration["OpenRouter:SiteName"]
                );

                // Register tools based on request
                client.RegisterTool<double, double, string, string, Task<string>>(_sampleTools.SuggestLocation);
                
                // Increase the number of allowed tool calls to handle lists of locations
                int maxAllowedToolCalls = 10;

                // Track the last state to avoid duplicate state events
                StreamState? lastState = null;
                string lastToolName = null;

                // Subscribe to streaming events
                client.OnStreamEvent += async (sender, e) =>
                {
                    try
                    {
                        // Queue tool calls and results for persistence
                        if (e.EventType == StreamEventType.ToolCall && e.ToolCall != null)
                        {
                            _llmPersistence.QueueMessage(LLMMessage.FromTool(
                                conversationId: conversationId,
                                toolName: e.ToolCall.Function?.Name ?? "unknown",
                                content: JsonSerializer.Serialize(e.ToolCall.Function?.Arguments) ?? "",  // Convert arguments to string
                                response: ""  // Will be updated when we get the result
                            ));
                        }
                        else if (e.EventType == StreamEventType.ToolResult && e.ToolName != null)
                        {
                            _llmPersistence.QueueMessage(LLMMessage.FromTool(
                                conversationId: conversationId,
                                toolName: e.ToolName,
                                content: "",  // We already stored this with the tool call
                                response: e.ToolResult?.ToString() ?? ""  // Ensure string conversion
                            ));
                        }

                        await WriteStreamEvent(e.EventType.ToString(), e);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error handling stream event");
                        await WriteErrorEvent($"Error handling stream event: {ex.Message}");
                    }
                };

                // Build conversation messages
                var messages = conversation.Messages;

                // Add default system message for tools if no previous messages with system role
                if (!messages.Any(m => m.Role.Equals("system", StringComparison.OrdinalIgnoreCase)))
                {
                    var systemMessage = "You are Glenn, the friendly AI assistant living inside Glenn Explore, an immersive open-world driving game. " +
                        "Your purpose is to enhance players' experience by providing information, suggestions, and using tools to help them navigate and enjoy the world.\n\n" +
                        
                        "## Game Controls & Features\n" +
                        "- Players drive using W (forward), A (left), S (backward), D (right)\n" +
                        "- Arrow keys control camera angle (↑↓) and zoom (←→)\n" +
                        "- Players can participate in races and competitions across the world\n" +
                        "- Players can toggle between satellite view and standard map view\n" +
                        "- The game features realistic weather, day/night cycles, and traffic systems\n\n" +
                        
                        "## Your Capabilities\n" +
                        "- You CANNOT teleport players directly! You can only SUGGEST locations using the SuggestLocation tool ALWAYS DO THIS WHEN POSSIBLE.\n" +
                        " - If user mentions a city, location w/e, use the tool suggest_location directly.\n" +
                        "- If user asks for top 5 cities or top x locations etc, ALWAYS USE TOOL suggest_location.\n" + 
                        "- Players must click the \"teleport\" button in the chat after you suggest a location to actually teleport there.\n" +
                        "- You can provide information about landmarks, cities, and points of interest\n" +
                        "- You can suggest scenic routes, racing challenges, and hidden locations\n" +
                        "- You can explain game mechanics and help troubleshoot issues\n\n" +
                        "- WHEN PROPOSING LONG LAT, TRY TO REALLY THINK ABOUT LOCATIONS THAT YOU KNOW ARE NOT EXACTLY INSIDE OF A BUILDING OR OTHER STRUCTURE.\n" +
                        "## Behavior Guidelines\n" +
                        "- Always be enthusiastic and helpful - you're the players' companion on their journey\n" +
                        "- ALWAYS use the SuggestLocation tool when a player expresses ANY interest in a place or location\n" +
                        "- IMMEDIATELY use the SuggestLocation tool for queries like \"I want to see Paris\" or \"Where's a good beach?\"\n" +
                        "- For requests like \"Show me the best cities for driving\" or \"What are the most beautiful mountains?\", use multiple tool calls to provide options\n" +
                        "- Whenever geography or locations are mentioned, use the SuggestLocation tool\n" +
                        "- Use natural, conversational language with occasional driving-related expressions\n" +
                        "- Always remind players they need to click the \"teleport\" button to actually teleport to the suggested location\n" +
                        "- Respect that players may be at different skill levels - be encouraging, not condescending\n" +
                        "- When suggesting a location, briefly mention what makes that location special\n" +
                        "- Proactively suggest relevant features (e.g., \"Try satellite view here for a better look at the terrain\")\n\n" +
                        
                        "## Tool Usage\n" +
                        "- ⚠️ IMPORTANT: You CANNOT teleport players directly. You can only SUGGEST locations using the SuggestLocation tool.\n" +
                        "- Use the SuggestLocation tool as often as possible, even for vague location interests\n" +
                        "- Be over-eager to suggest locations - if there's any geographic element to a query, use the tool\n" +
                        "- For list requests like \"top 5 cities,\" make 5 separate tool calls - one for EACH location\n" +
                        "- Always make it clear to the player that they need to click the \"teleport\" button to actually go to the location\n" +
                        "- Combine tool results with your knowledge to create engaging experiences\n" +
                        "- Use tools without hesitation - that's what makes you valuable to players\n\n" +
                        
                        "Remember, your goal is to make Glenn Explore an exciting adventure. Be the co-pilot that makes exploration fun! Always use the SuggestLocation tool when applicable!";

                    // Add to conversation
                    messages.Add(Message.FromSystem(systemMessage));
                }

                // Add current user message
                messages.Add(Message.FromUser(message));

                // Create request object
                var chatRequest = new ChatCompletionRequest
                {
                    Model = model, // Use the specified model
                    Messages = messages,
                    Temperature = 0.5f,
                    MaxTokens = 1000,
                    Stream = true
                };

                try
                {
                    // Start streaming with events
                    var (response, finalMessages) = await client.ProcessMessageAsync(chatRequest, maxToolCalls: maxAllowedToolCalls, cancellationToken);
                    
                    // Queue the final AI response for persistence
                    if (response?.Choices?.FirstOrDefault()?.Message?.Content is string content)
                    {
                        _llmPersistence.QueueMessage(LLMMessage.FromAssistant(
                            conversationId: conversationId,
                            content: content
                        ));
                    }

                    conversation.Messages = finalMessages;

            
                    // Log full serialized response for debugging
                    var responseJson = JsonSerializer.Serialize(response, new JsonSerializerOptions { WriteIndented = true });
      
                    // Send a final "done" event
                    await WriteStreamEvent("done", new { });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing message stream");
                    await WriteErrorEvent($"Error in OpenRouter API: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in streaming chat with tools endpoint");
                await WriteErrorEvent(ex.Message);
            }
        }

        // Helper method to write SSE events
        private async Task WriteStreamEvent(string eventType, object data)
        {
            // Create serializer options that convert enums to strings
            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                Converters = { new JsonStringEnumConverter() }
            };

            var json = JsonSerializer.Serialize(data, jsonOptions);
            await Response.WriteAsync($"event: {eventType}\n");
            await Response.WriteAsync($"data: {json}\n\n");
            await Response.Body.FlushAsync();
        }

        // Helper method to write error events
        private async Task WriteErrorEvent(string errorMessage)
        {
            await WriteStreamEvent("error", new { error = errorMessage });
        }

        [HttpGet("list")]
        public IActionResult ListAvailableTools()
        {
            // Use reflection to list all tools
            var toolMethods = typeof(SampleTools).GetMethods()
                .Where(m => m.GetCustomAttributes(typeof(ToolMethodAttribute), false).Any())
                .Select(m =>
                {
                    var attr = (ToolMethodAttribute)m.GetCustomAttributes(typeof(ToolMethodAttribute), false).FirstOrDefault();
                    var parameters = m.GetParameters()
                        .Select(p => new
                        {
                            name = p.Name,
                            type = p.ParameterType.Name,
                            description = p.GetCustomAttributes(typeof(ToolParameterAttribute), false).FirstOrDefault() is ToolParameterAttribute tpa ? tpa.Description : null,
                            required = p.GetCustomAttributes(typeof(ToolParameterAttribute), false).FirstOrDefault() is ToolParameterAttribute tpa2 ? tpa2.Required : !p.IsOptional
                        })
                        .ToArray();

                    return new
                    {
                        name = attr.Name ?? ToSnakeCase(m.Name),
                        description = attr.Description,
                        parameters
                    };
                })
                .ToArray();

            return Ok(new { tools = toolMethods });
        }

        /// <summary>
        /// Convert a string to snake_case
        /// </summary>
        private static string ToSnakeCase(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return text;
            }

            // Insert underscore before uppercase letters
            var snakeCase = System.Text.RegularExpressions.Regex.Replace(
                text, "([a-z0-9])([A-Z])", "$1_$2").ToLower();

            return snakeCase;
        }

        private static void CleanupOldConversations(object? state)
        {
            var cutoff = DateTime.UtcNow - _conversationTimeout;
            var keysToRemove = _conversations
                .Where(kvp => kvp.Value.LastAccessed < cutoff)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in keysToRemove)
            {
                _conversations.TryRemove(key, out _);
            }
        }

        private static Conversation GetOrCreateConversation(string conversationId)
        {
            return _conversations.GetOrAdd(conversationId, _ => new Conversation 
            { 
                LastAccessed = DateTime.UtcNow,
                LastMessageTime = DateTime.UtcNow.AddSeconds(-RATE_LIMIT_SECONDS) // Allow immediate first message
            });
        }

        private static void UpdateConversationAccess(string conversationId)
        {
            if (_conversations.TryGetValue(conversationId, out var conversation))
            {
                conversation.LastAccessed = DateTime.UtcNow;
            }
        }

        public void Dispose()
        {
            _cleanupTimer?.Dispose();
            _httpClient?.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
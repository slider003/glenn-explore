using Api.Core.Infrastructure.Database;
using Api.Features.OpenRouter.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace Api.Features.OpenRouter.Services;

public class LLMMessagePersistenceService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ConcurrentQueue<LLMMessage> _messageQueue = new();
    private readonly ILogger<LLMMessagePersistenceService> _logger;

    public LLMMessagePersistenceService(
        IServiceScopeFactory scopeFactory,
        ILogger<LLMMessagePersistenceService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public void QueueMessage(LLMMessage message)
    {
        _messageQueue.Enqueue(message);
    }

    public async Task<List<LLMMessage>> GetConversationMessages(string conversationId)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        return await dbContext.LLMMessages
            .Where(m => m.ConversationId == conversationId)
            .OrderBy(m => m.SentAt)
            .ToListAsync();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Process messages every 5 seconds
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

                var messages = new List<LLMMessage>();
                while (_messageQueue.TryDequeue(out var message))
                {
                    messages.Add(message);
                }

                if (messages.Any())
                {
                    // Create a new scope for each batch of processing
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    await db.LLMMessages.AddRangeAsync(messages, stoppingToken);
                    await db.SaveChangesAsync(stoppingToken);

                    _logger.LogInformation("Persisted {Count} LLM messages", messages.Count);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error persisting LLM messages");
            }
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        // Final attempt to save any remaining messages
        if (!_messageQueue.IsEmpty)
        {
            try
            {
                var messages = new List<LLMMessage>();
                while (_messageQueue.TryDequeue(out var message))
                {
                    messages.Add(message);
                }

                if (messages.Any())
                {
                    // Create a new scope for each batch of processing
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    await db.LLMMessages.AddRangeAsync(messages, cancellationToken);
                    await db.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation("Persisted {Count} LLM messages", messages.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist remaining LLM messages during shutdown");
            }
        }
        
        await base.StopAsync(cancellationToken);
    }
} 
using Api.Core.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;

namespace Api.Source.Features.Game;

public class MessagePersistenceService : BackgroundService
{
    private readonly ILogger<MessagePersistenceService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly PeriodicTimer _timer;
    private readonly ConcurrentQueue<Message> _messageQueue = new();
    private const int DefaultRecentMessageCount = 20;

    public MessagePersistenceService(
        ILogger<MessagePersistenceService> logger,
        IServiceProvider serviceProvider,
        IOptions<GameOptions> options)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _timer = new PeriodicTimer(TimeSpan.FromSeconds(options.Value.PersistenceIntervalSeconds));
    }

    public void QueueMessage(Message message)
    {
        _messageQueue.Enqueue(message);
    }

    public async Task<List<Message>> GetRecentMessages(int count = DefaultRecentMessageCount)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        return await dbContext.Messages
            .Where(m => m.Type == MessageType.Chat) // Only get chat messages
            .OrderByDescending(m => m.SentAt)
            .Take(count)
            .OrderBy(m => m.SentAt) // Re-order to show oldest first
            .ToListAsync();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Message persistence service starting");

        try
        {
            while (await _timer.WaitForNextTickAsync(stoppingToken))
            {
                await PersistMessages(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Message persistence service stopping");
        }
    }

    private async Task PersistMessages(CancellationToken cancellationToken)
    {
        var messages = new List<Message>();
        
        // Dequeue all current messages
        while (_messageQueue.TryDequeue(out var message))
        {
            messages.Add(message);
        }

        if (messages.Count == 0) return;

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            await dbContext.Messages.AddRangeAsync(messages, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Persisted {Count} messages", messages.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error persisting messages");
            // Re-queue failed messages
            foreach (var message in messages)
            {
                _messageQueue.Enqueue(message);
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
                await PersistMessages(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist remaining messages during shutdown");
            }
        }
        
        await base.StopAsync(cancellationToken);
    }
} 
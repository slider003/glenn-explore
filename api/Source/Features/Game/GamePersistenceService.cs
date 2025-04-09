using Api.Core.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Api.Source.Features.Game;

public class GamePersistenceService : BackgroundService
{
    private readonly ILogger<GamePersistenceService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly GameStateManager _gameState;
    private readonly PeriodicTimer _timer;
    private readonly TimeSpan _interval;

    public GamePersistenceService(
        ILogger<GamePersistenceService> logger,
        IServiceProvider serviceProvider,
        GameStateManager gameState,
        IOptions<GameOptions> options)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _gameState = gameState;
        _interval = TimeSpan.FromSeconds(options.Value.PersistenceIntervalSeconds);
        _timer = new PeriodicTimer(_interval);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Game persistence service starting");

        try
        {
            while (await _timer.WaitForNextTickAsync(stoppingToken))
            {
                await PersistPlayerStates(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Game persistence service stopping");
        }
    }

    private async Task PersistPlayerStates(CancellationToken cancellationToken)
    {
        var dirtyEntities = _gameState.GetAndClearDirtyEntities().ToHashSet();
        if (dirtyEntities.Count == 0) return;

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Get all current states
            var playerStates = dirtyEntities
                .Select(id => _gameState.GetPlayer(id))
                .Where(p => p != null)
                .ToDictionary(p => p!.PlayerId);

            if (playerStates.Count == 0) return;

            // Load existing players in one query
            var existingPlayers = await dbContext.Players
                .Where(p => dirtyEntities.Contains(p.PlayerId))
                .ToDictionaryAsync(p => p.PlayerId, cancellationToken);

            foreach (var (playerId, playerState) in playerStates)
            {
                // Increment online time by interval
                playerState.TotalTimeOnline += _interval;
                
                var player = Player.FromPlayerState(playerState);
                
                if (existingPlayers.TryGetValue(playerId, out var existingPlayer))
                {
                    // Update existing
                    dbContext.Entry(existingPlayer).CurrentValues.SetValues(player);
                }
                else
                {
                    // Add new
                    dbContext.Players.Add(player);
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Persisted {Count} player states", playerStates.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error persisting player states");
            // Re-mark failed entities as dirty
            foreach (var id in dirtyEntities)
            {
                _gameState.MarkPlayerAsDirty(id);
            }
        }
    }
}
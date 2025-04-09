using Microsoft.AspNetCore.SignalR;

namespace Api.Source.Features.Game;

public class GameStateBackgroundService : BackgroundService
{
    private readonly ILogger<GameStateBackgroundService> _logger;
    private readonly GameStateManager _gameState;
    private readonly IHubContext<GameHub> _hubContext;
    private const int BROADCAST_INTERVAL = 300; // 300ms

    public GameStateBackgroundService(
        ILogger<GameStateBackgroundService> logger,
        GameStateManager gameState,
        IHubContext<GameHub> hubContext)
    {
        _logger = logger;
        _gameState = gameState;
        _hubContext = hubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var players = _gameState.GetAllPlayers()
                    .Where(p => p.Position != null)
                    .Select(p => new {
                        playerId = p.PlayerId,
                        name = p.Name,
                        position = p.Position,
                        currentSpeed = p.CurrentSpeed,
                        kilometersDriven = p.KilometersDriven,
                        modelType = p.ModelType,
                        animationState = p.AnimationState,
                        stateType = p.StateType,
                        timestamp = DateTime.UtcNow
                    })
                    .ToList();

                if (players.Any())
                {
                    await _hubContext.Clients.All.SendAsync("PlayerPositionsUpdate", players, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting player positions");
            }

            await Task.Delay(BROADCAST_INTERVAL, stoppingToken);
        }
    }
} 
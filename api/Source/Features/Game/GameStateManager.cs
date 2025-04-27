using System.Collections.Concurrent;

namespace Api.Source.Features.Game;

public class GameStateManager
{
    private readonly ConcurrentDictionary<string, PlayerState> _players = new();
    private readonly ConcurrentDictionary<string, Dictionary<string, int>> _questProgress = new();
    private readonly ConcurrentBag<string> _dirtyEntities = new();
    private readonly ILogger<GameStateManager> _logger;

    public GameStateManager(ILogger<GameStateManager> logger)
    {
        _logger = logger;
    }

    public void AddPlayer(string playerId, PlayerState state)
    {
        _questProgress.TryAdd(playerId, new Dictionary<string, int>());
        _players.TryAdd(playerId, state);
        _dirtyEntities.Add(playerId);
        _logger.LogDebug("Added player {PlayerId}", playerId);
    }

    public void RemovePlayer(string playerId)
    {
        _questProgress.TryRemove(playerId, out _);
        _players.TryRemove(playerId, out _);
        _dirtyEntities.Add(playerId); // Mark for persistence to record last state
        _logger.LogDebug("Removed player {PlayerId}", playerId);
    }

    public IEnumerable<PlayerState> GetAllPlayers()
    {
        return _players.Values;
    }

    public void UpdatePlayerPosition(string playerId, PositionUpdate positionUpdate)
    {
        if (_players.TryGetValue(playerId, out var player))
        {
            player.Position = positionUpdate.Position;
            player.LastSeen = DateTime.UtcNow;
            player.CurrentSpeed = positionUpdate.CurrentSpeed;
            player.KilometersDriven = positionUpdate.KilometersDriven;
            player.ModelType = positionUpdate.ModelType;
            player.AnimationState = positionUpdate.AnimationState;
            player.StateType = positionUpdate.StateType;
            _dirtyEntities.Add(playerId);
        }
    }

   

    public PlayerState? GetPlayer(string playerId)
    {
        _players.TryGetValue(playerId, out var state);
        return state;
    }

    public IEnumerable<string> GetAndClearDirtyEntities()
    {
        var dirtyIds = new List<string>();
        while (_dirtyEntities.TryTake(out var id))
        {
            dirtyIds.Add(id);
        }
        return dirtyIds;
    }

    public void MarkPlayerAsDirty(string playerId)
    {
        _dirtyEntities.Add(playerId);
    }

    public void UpdateQuestProgress(string playerId, string questId, int progress)
    {
        if (_questProgress.TryGetValue(playerId, out var playerProgress))
        {
            playerProgress[questId] = progress;
            _dirtyEntities.Add(playerId);
            _logger.LogDebug("Updated quest progress for player {PlayerId}, quest {QuestId}: {Progress}", playerId, questId, progress);
        }
    }

    public Dictionary<string, int>? GetPlayerQuestProgress(string playerId)
    {
        _questProgress.TryGetValue(playerId, out var progress);
        return progress;
    }

    public void SetPlayerQuestProgress(string playerId, Dictionary<string, int> progress)
    {
        _questProgress.AddOrUpdate(playerId, progress, (_, _) => progress);
        _dirtyEntities.Add(playerId);
    }
} 
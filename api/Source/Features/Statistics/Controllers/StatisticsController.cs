using System;
using System.Linq;
using System.Threading.Tasks;
using Api.Core.Infrastructure.Database;
using Api.Source.Features.Statistics.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Api.Source.Features.Statistics.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private const string STATS_CACHE_KEY = "game_statistics";
    private const int CACHE_MINUTES = 10;

    public StatisticsController(ApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    [HttpGet]
    public async Task<ActionResult<GameStatistics>> GetStatistics()
    {
        // Try get from cache first
        if (_cache.TryGetValue(STATS_CACHE_KEY, out GameStatistics cachedStats))
        {
            return Ok(cachedStats);
        }

        var now = DateTime.UtcNow;
        var last24h = now.AddHours(-24);

        // Get all players for calculations
        var players = await _context.Players.ToListAsync();
        
        // Calculate total game time
        var totalGameTime = players.Aggregate(
            TimeSpan.Zero,
            (sum, player) => sum + player.TotalTimeOnline
        );

        // Get top 3 players
        var topPlayers = players
            .OrderByDescending(p => p.TotalTimeOnline)
            .Take(3)
            .Select(p => new TopPlayerPreview
            {
                PlayerName = p.Name,
                PlayTime = p.TotalTimeOnline,
                PercentageOfTotal = totalGameTime.TotalSeconds > 0 
                    ? (p.TotalTimeOnline.TotalSeconds / totalGameTime.TotalSeconds) * 100
                    : 0
            })
            .ToList();

        // Calculate peak hours (using LastSeen)
        var peakHours = players
            .GroupBy(p => p.LastSeen.Hour)
            .ToDictionary(
                g => g.Key,
                g => g.Count()
            );

        var stats = new GameStatistics
        {
            // Player Engagement
            TotalPlayers = players.Count,
            OnlinePlayers = players.Count(p => p.CurrentSessionStart != null),
            ActivePlayers24h = players.Count(p => p.LastSeen >= last24h),
            AveragePlayTime = players.Any() 
                ? TimeSpan.FromSeconds(players.Average(p => p.TotalTimeOnline.TotalSeconds))
                : TimeSpan.Zero,
            TotalGameTime = totalGameTime,

            // Time Analysis
            PeakHours = peakHours,
            LongestSession = players
                .Where(p => p.CurrentSessionStart != null)
                .Select(p => now - p.CurrentSessionStart!.Value)
                .DefaultIfEmpty(TimeSpan.Zero)
                .Max(),
            AverageSessionLength = players
                .Where(p => p.CurrentSessionStart != null)
                .Select(p => now - p.CurrentSessionStart!.Value)
                .DefaultIfEmpty(TimeSpan.Zero)
                .Average(ts => ts.TotalSeconds) > 0
                    ? TimeSpan.FromSeconds(players
                        .Where(p => p.CurrentSessionStart != null)
                        .Select(p => now - p.CurrentSessionStart!.Value)
                        .Average(ts => ts.TotalSeconds))
                    : TimeSpan.Zero,

            // Top Players
            TopPlayers = topPlayers
        };

        // Cache the result
        _cache.Set(STATS_CACHE_KEY, stats, TimeSpan.FromMinutes(CACHE_MINUTES));

        return Ok(stats);
    }
} 
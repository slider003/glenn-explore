using System;
using System.Collections.Generic;

namespace Api.Source.Features.Statistics.Models;

public class GameStatistics
{
    // Player Engagement
    public int TotalPlayers { get; set; }
    public int OnlinePlayers { get; set; }
    public int ActivePlayers24h { get; set; }
    public TimeSpan AveragePlayTime { get; set; }
    public TimeSpan TotalGameTime { get; set; }

    // Time Analysis
    public Dictionary<int, int> PeakHours { get; set; } = new();  // Hour -> Player count
    public TimeSpan LongestSession { get; set; }
    public TimeSpan AverageSessionLength { get; set; }

    // Top Players Preview
    public List<TopPlayerPreview> TopPlayers { get; set; } = new();
}

public class TopPlayerPreview
{
    public string PlayerName { get; set; } = string.Empty;
    public TimeSpan PlayTime { get; set; }
    public double PercentageOfTotal { get; set; }  // What % of total game time
} 
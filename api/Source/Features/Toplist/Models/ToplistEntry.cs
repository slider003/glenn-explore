using System;

namespace Api.Source.Features.Toplist.Models;

public class ToplistEntry
{
    public string PlayerId { get; set; } = null!;
    public string PlayerName { get; set; } = null!;
    public int Rank { get; set; }
    public TimeSpan Value { get; set; }  // For time-based toplists
    public string? ValueString { get; set; }  // For custom formatted values (e.g., "42.5 km")
} 
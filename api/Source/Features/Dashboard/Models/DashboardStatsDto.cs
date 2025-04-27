using System;

namespace Api.Source.Features.Dashboard.Models;

public class DashboardStatsDto
{
    // Retention Metrics
    public int NewUsersInPeriod { get; set; }
    public int ReturningUsersInPeriod { get; set; }
    public double RetentionRate { get; set; } // Percentage of users who came back
    public double ChurnRate { get; set; } // Percentage of users who haven't returned
    public int DailyActiveUsers { get; set; }
    public int WeeklyActiveUsers { get; set; }
    public int MonthlyActiveUsers { get; set; }

    // User Stats
    public int TotalUsersLoggedIn { get; set; }
    public int UniqueUsersLoggedIn { get; set; }
    public double AverageSessionDuration { get; set; }
    
    // Game Stats
    public int TotalQuestsCompleted { get; set; }
    public int TotalRacesCompleted { get; set; }
    public double TotalKilometersDriven { get; set; }
    public double AverageSpeed { get; set; }
    public int ConcurrentPlayers { get; set; }
    
    // AI Interaction Stats
    public int TotalAIMessagesSent { get; set; }
    public int UniqueUsersUsingAI { get; set; }
    public double AverageAIMessagesPerUser { get; set; }
    
    // Time Range
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

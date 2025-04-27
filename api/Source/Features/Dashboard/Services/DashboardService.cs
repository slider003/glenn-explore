using System;
using System.Linq;
using System.Threading.Tasks;
using Api.Core.Infrastructure.Database;
using Api.Source.Features.Dashboard.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Source.Features.Dashboard.Services;

public class DashboardService
{
    private readonly ApplicationDbContext _dbContext;

    public DashboardService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DashboardStatsDto> GetDashboardStats(DateTime startDate, DateTime endDate)
    {
        var stats = new DashboardStatsDto
        {
            StartDate = startDate,
            EndDate = endDate
        };

        // Retention Metrics
        var now = endDate;
        var oneDayAgo = now.AddDays(-1);
        var oneWeekAgo = now.AddDays(-7);
        var oneMonthAgo = now.AddMonths(-1);
        var periodLength = endDate - startDate;
        var previousPeriodStart = startDate.AddTicks(-periodLength.Ticks);
        var previousPeriodEnd = startDate;

        // New vs Returning Users
        var newUsers = await _dbContext.Users
            .CountAsync(u => u.CreatedAt >= startDate && u.CreatedAt <= endDate);

        // A returning user is someone who was active in this period AND created their account before this period
        var returningUsers = await _dbContext.Users
            .CountAsync(u => u.LastSeen >= startDate && u.LastSeen <= endDate && u.CreatedAt < startDate);

        stats.NewUsersInPeriod = newUsers;
        stats.ReturningUsersInPeriod = returningUsers;

        // Calculate retention rate based on active users
        // Get users who were active in the previous period
        var activeInPreviousPeriod = await _dbContext.Users
            .CountAsync(u => u.LastSeen >= previousPeriodStart && u.LastSeen <= previousPeriodEnd);

        if (activeInPreviousPeriod > 0)
        {
            stats.RetentionRate = (double)returningUsers / activeInPreviousPeriod * 100;
            stats.ChurnRate = 100 - stats.RetentionRate;
        }
        else
        {
            stats.RetentionRate = 0;
            stats.ChurnRate = 0;
        }

        // Active Users (DAU/WAU/MAU)
        // Use a combination of User.LastSeen and Player.LastSeen to catch all activity
        stats.DailyActiveUsers = await _dbContext.Users
            .CountAsync(u => u.LastSeen >= oneDayAgo || 
                            _dbContext.Players.Any(p => p.PlayerId == u.Id && p.LastSeen >= oneDayAgo));

        stats.WeeklyActiveUsers = await _dbContext.Users
            .CountAsync(u => u.LastSeen >= oneWeekAgo || 
                            _dbContext.Players.Any(p => p.PlayerId == u.Id && p.LastSeen >= oneWeekAgo));

        stats.MonthlyActiveUsers = await _dbContext.Users
            .CountAsync(u => u.LastSeen >= oneMonthAgo || 
                            _dbContext.Players.Any(p => p.PlayerId == u.Id && p.LastSeen >= oneMonthAgo));

        // User Stats
        var activePlayers = await _dbContext.Players
            .Where(p => p.LastSeen >= startDate && p.LastSeen <= endDate)
            .ToListAsync();

        stats.TotalUsersLoggedIn = activePlayers?.Count ?? 0;
        stats.UniqueUsersLoggedIn = activePlayers?.Select(p => p.PlayerId).Distinct().Count() ?? 0;
        var playersWithSessions = activePlayers?.Where(p => p.CurrentSessionStart.HasValue).ToList();
        stats.AverageSessionDuration = playersWithSessions?.Any() == true
            ? playersWithSessions.Average(p => p.TotalTimeOnline.TotalMinutes)
            : 0;

        // Game Stats
        stats.TotalQuestsCompleted = await _dbContext.QuestProgress
            .Where(qp => qp.UpdatedAt >= startDate && qp.UpdatedAt <= endDate)
            .CountAsync();

        stats.TotalRacesCompleted = await _dbContext.RaceResults
            .Where(r => r.CompletedAt >= startDate && r.CompletedAt <= endDate)
            .CountAsync();

        stats.TotalKilometersDriven = activePlayers?.Sum(p => p.KilometersDriven) ?? 0;
        var playersWithSpeed = activePlayers?.Where(p => p.CurrentSpeed > 0).ToList();
        stats.AverageSpeed = playersWithSpeed?.Any() == true
            ? playersWithSpeed.Average(p => p.CurrentSpeed)
            : 0;
        // Consider players "concurrent" if they've been seen in the last 15 minutes of the end date
        var fifteenMinutesAgo = endDate.AddMinutes(-15);
        stats.ConcurrentPlayers = await _dbContext.Players
            .CountAsync(p => p.LastSeen >= fifteenMinutesAgo && p.LastSeen <= endDate);

        // AI Stats
        // AI Stats
        var aiMessages = await _dbContext.LLMMessages
            .Where(m => m.SentAt >= startDate && m.SentAt <= endDate && m.Role == "user")
            .ToListAsync();

        stats.TotalAIMessagesSent = aiMessages.Count;
        var uniqueConversations = aiMessages.Select(m => m.ConversationId).Distinct().ToList();
        stats.UniqueUsersUsingAI = uniqueConversations.Count;
        stats.AverageAIMessagesPerUser = uniqueConversations.Any()
            ? (double)aiMessages.Count / uniqueConversations.Count
            : 0;

        // Ensure we don't divide by zero for retention rate
        if (activeInPreviousPeriod == 0)
        {
            stats.RetentionRate = 0;
            stats.ChurnRate = 0;
        }

        return stats;
    }
}

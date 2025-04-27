export interface DashboardStats {
  // Retention Metrics
  newUsersInPeriod: number;
  returningUsersInPeriod: number;
  retentionRate: number;
  churnRate: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;

  // User Stats
  totalUsersLoggedIn: number;
  uniqueUsersLoggedIn: number;
  averageSessionDuration: number;

  // Game Stats
  totalQuestsCompleted: number;
  totalRacesCompleted: number;
  totalKilometersDriven: number;
  averageSpeed: number;
  concurrentPlayers: number;

  // AI Stats
  totalAIMessagesSent: number;
  uniqueUsersUsingAI: number;
  averageAIMessagesPerUser: number;

  // Date Range
  startDate: string;
  endDate: string;
}

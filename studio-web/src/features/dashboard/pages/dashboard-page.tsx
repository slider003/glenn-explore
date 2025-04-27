import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { useGetApiDashboardStats } from '../../../api/hooks/api';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Loader2, TrendingUp, Users, GamepadIcon, Bot } from 'lucide-react';
import { TimeRangeSelector, type TimeRange } from '../components/time-range-selector';
import { useState } from 'react';
import { formatDuration } from '../utils/format-duration';

export function DashboardPage() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>({
    label: 'Today',
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date())
  });

  const { data: stats, isLoading } = useGetApiDashboardStats({
    startDate: selectedRange.startDate.toISOString(),
    endDate: selectedRange.endDate.toISOString()
  }, {
    query: {
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <TimeRangeSelector
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Users */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Users
            </CardTitle>
            <CardDescription>Current user activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Logins</p>
                <p className="text-2xl font-bold">{stats.totalUsersLoggedIn}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Unique Logins</p>
                <p className="text-2xl font-bold">{stats.uniqueUsersLoggedIn}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Daily</p>
                <p className="text-2xl font-bold">{stats.dailyActiveUsers}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Weekly</p>
                <p className="text-2xl font-bold">{stats.weeklyActiveUsers}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Monthly</p>
                <p className="text-2xl font-bold">{stats.monthlyActiveUsers}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Online Now</p>
                <p className="text-2xl font-bold">{stats.concurrentPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Retention */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              User Retention
            </CardTitle>
            <CardDescription>New vs returning users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">New Users</p>
                <p className="text-2xl font-bold">{stats.newUsersInPeriod}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Returning</p>
                <p className="text-2xl font-bold">{stats.returningUsersInPeriod}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Retention</p>
                <p className="text-2xl font-bold">{(stats.retentionRate ?? 0).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium">Churn</p>
                <p className="text-2xl font-bold">{(stats.churnRate ?? 0).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Stats */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GamepadIcon className="h-5 w-5" />
              Game Activity
            </CardTitle>
            <CardDescription>Racing and quest progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Races</p>
                <p className="text-2xl font-bold">{stats.totalRacesCompleted}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Quests</p>
                <p className="text-2xl font-bold">{stats.totalQuestsCompleted}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Distance</p>
                <p className="text-2xl font-bold">{Math.round(stats.totalKilometersDriven ?? 0)} km</p>
              </div>
              <div>
                <p className="text-sm font-medium">Avg Speed</p>
                <p className="text-2xl font-bold">{Math.round(stats.averageSpeed ?? 0)} km/h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Usage */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Interaction
            </CardTitle>
            <CardDescription>Chat and tool usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Messages</p>
                <p className="text-2xl font-bold">{stats.totalAIMessagesSent}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Users</p>
                <p className="text-2xl font-bold">{stats.uniqueUsersUsingAI}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Msgs/User</p>
                <p className="text-2xl font-bold">{(stats.averageAIMessagesPerUser ?? 0).toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Avg Session</p>
                <p className="text-2xl font-bold">{formatDuration(stats.averageSessionDuration ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        Data from {format(new Date(stats.startDate ?? new Date()), 'PPP pp')} to {format(new Date(stats.endDate ?? new Date()), 'PPP pp')}
      </div>
    </div>
  );
}

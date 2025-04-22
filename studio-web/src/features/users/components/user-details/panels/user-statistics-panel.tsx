import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface UserStatisticsPanelProps {
    userId: string;
}

export function UserStatisticsPanel({ userId }: UserStatisticsPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Statistics</CardTitle>
                <CardDescription>View detailed user statistics and analytics</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon...</p>
            </CardContent>
        </Card>
    );
}

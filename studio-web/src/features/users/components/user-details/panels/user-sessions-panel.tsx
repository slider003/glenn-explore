import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface UserSessionsPanelProps {
    userId: string;
}

export function UserSessionsPanel({ userId }: UserSessionsPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Sessions</CardTitle>
                <CardDescription>View and manage user sessions</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon...</p>
            </CardContent>
        </Card>
    );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface UserModelsPanelProps {
    userId: string;
}

export function UserModelsPanel({ userId }: UserModelsPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Models</CardTitle>
                <CardDescription>Manage user's available models</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon...</p>
            </CardContent>
        </Card>
    );
}

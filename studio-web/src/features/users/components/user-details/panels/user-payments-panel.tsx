import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface UserPaymentsPanelProps {
    userId: string;
}

export function UserPaymentsPanel({ userId }: UserPaymentsPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View user payment history and manage payment status</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon...</p>
            </CardContent>
        </Card>
    );
}

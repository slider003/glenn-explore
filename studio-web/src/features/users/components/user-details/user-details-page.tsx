import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { UserDetailsPanel } from "./panels/user-details-panel";
import { UserModelsPanel } from "./panels/user-models-panel";
import { UserSessionsPanel } from "./panels/user-sessions-panel";
import { UserPaymentsPanel } from "./panels/user-payments-panel";
import { UserStatisticsPanel } from "./panels/user-statistics-panel";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/shared/components/ui/breadcrumb";
import { Users } from "lucide-react";
import { useGetApiUsersId } from "@/api/hooks/api";

export function UserDetailsPage() {
    const { userId } = useParams();
    const { data: user, isLoading, error } = useGetApiUsersId(userId!);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="space-y-3 text-center animate-pulse">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
                    <p className="text-lg text-muted-foreground">Loading user details...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="space-y-3 text-center text-destructive">
                    <p className="text-lg">Unable to load user details</p>
                    <p className="text-sm text-muted-foreground">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <header className="space-y-4">
                <Breadcrumb>
                    <BreadcrumbItem>
                        <BreadcrumbLink to="/studio/users">Users</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        {user.email}
                    </BreadcrumbItem>
                </Breadcrumb>
                <h1 className="text-2xl font-bold tracking-tight">
                    {user.firstName} {user.lastName}
                </h1>
            </header>

            <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="models">Models</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <UserDetailsPanel user={user} />
                </TabsContent>
                <TabsContent value="models">
                    <UserModelsPanel userId={user.id} />
                </TabsContent>
                <TabsContent value="sessions">
                    <UserSessionsPanel userId={user.id} />
                </TabsContent>
                <TabsContent value="payments">
                    <UserPaymentsPanel userId={user.id} />
                </TabsContent>
                <TabsContent value="statistics">
                    <UserStatisticsPanel userId={user.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

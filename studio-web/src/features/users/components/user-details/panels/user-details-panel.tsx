import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/components/ui/use-toast";
import { formatDistance } from "date-fns";
import { UserResponseDTO } from "@/api/models/userResponseDTO";
import { usePutApiUsersAdminUserIdMakeAdmin, usePutApiUsersAdminUserIdSetPaid } from "@/api/hooks/api";

interface UserDetailsPanelProps {
    user: UserResponseDTO;
}

export function UserDetailsPanel({ user }: UserDetailsPanelProps) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [hasPaid, setHasPaid] = useState(user.hasPaid ?? false);
    const { toast } = useToast();

    const makeAdmin = usePutApiUsersAdminUserIdMakeAdmin({
        mutation: {
            onSuccess: () => {
                toast({
                    title: "User updated",
                    description: "Admin status has been successfully updated.",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update admin status. Please try again.",
                    variant: "destructive",
                });
            }
        }
    });

    const setPaid = usePutApiUsersAdminUserIdSetPaid({
        mutation: {
            onSuccess: () => {
                toast({
                    title: "User updated",
                    description: "Payment status has been successfully updated.",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update payment status. Please try again.",
                    variant: "destructive",
                });
            }
        }
    });

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>Basic information about the user account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-sm text-muted-foreground">
                            {user.firstName} {user.lastName}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                            {user.createdAt && formatDistance(new Date(user.createdAt), new Date(), { addSuffix: true })}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Status</CardTitle>
                    <CardDescription>Manage user permissions and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Admin Access
                        </label>
                        <Switch
                            checked={isAdmin}
                            onCheckedChange={(checked) => {
                                setIsAdmin(checked);
                                makeAdmin.mutate({ userId: user.id!, data: { confirm: true } });
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Payment Status
                        </label>
                        <Switch
                            checked={hasPaid}
                            onCheckedChange={(checked) => {
                                setHasPaid(checked);
                                setPaid.mutate({ userId: user.id!, data: { confirm: true } });
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Account Active
                        </label>
                        <Switch
                            checked={user.isActive}
                            onCheckedChange={(checked) => {
                                // TODO: Implement setActive mutation when available
                                toast({
                                    title: "Not implemented",
                                    description: "This feature is not yet available.",
                                    variant: "destructive",
                                });
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Activity</CardTitle>
                    <CardDescription>User activity information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Last Login</p>
                        <p className="text-sm text-muted-foreground">
                            {user.lastLoginAt
                                ? formatDistance(new Date(user.lastLoginAt), new Date(), { addSuffix: true })
                                : "Never"}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Last Seen</p>
                        <p className="text-sm text-muted-foreground">
                            {user.lastSeen && formatDistance(new Date(user.lastSeen), new Date(), { addSuffix: true })}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Total Time Online</p>
                        <p className="text-sm text-muted-foreground">
                            {user.totalTimeOnline ? `${Math.floor(parseInt(user.totalTimeOnline) / 3600)} hours` : "N/A"}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Device Settings</CardTitle>
                    <CardDescription>User device preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Low Performance Mode
                        </label>
                        <Switch
                            checked={user.isLowPerformanceDevice}
                            onCheckedChange={(_checked) => {
                                // TODO: Implement setLowPerformanceDevice mutation when available
                                toast({
                                    title: "Not implemented",
                                    description: "This feature is not yet available.",
                                    variant: "destructive",
                                });
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                    <CardDescription>Destructive actions for this account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        variant="destructive"
                        onClick={() => {
                            if (window.confirm("Are you sure you want to reset this user's password?")) {
                                // TODO: Implement password reset
                            }
                        }}
                    >
                        Reset Password
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

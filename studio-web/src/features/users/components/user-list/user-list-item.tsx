import { UserResponseDTO } from '../../api';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { format } from 'date-fns';
import { Trash2, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserListItemProps {
    user: UserResponseDTO;
    onDelete: (id: string) => void;
}

export function UserListItem({ user, onDelete }: UserListItemProps) {
    if (!user.id) return null;

    const formatDuration = (duration: string | undefined) => {
        if (!duration) return 'N/A';
        const match = duration.match(/^(\d+):(\d+):(\d+)$/);
        if (!match) return duration;
        const [_, hoursStr, minutesStr] = match;
        const hours = parseInt(hoursStr || '0');
        const minutes = parseInt(minutesStr || '0');
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `${days}d ${remainingHours}h`;
        }
        return `${hours}h ${minutes}m`;
    };

    return (
        <tr className="border-b transition-colors hover:bg-muted/50 group">
            <td className="p-4 align-middle">
                <Link 
                    to={`/studio/users/${user.id}`}
                    className="font-medium hover:underline"
                >
                    {user.firstName} {user.lastName}
                </Link>
            </td>
            <td className="p-4 align-middle">
                <span className="text-muted-foreground">{user.email}</span>
            </td>
            <td className="p-4 align-middle">
                <div className="flex flex-col gap-1">
                    <Badge 
                        variant={user.isActive ? "default" : "destructive"}
                        className={user.isActive ? "bg-emerald-500" : ""}
                    >
                        {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge 
                        variant={user.hasPaid ? "default" : "secondary"}
                        className={user.hasPaid ? "bg-blue-500" : ""}
                    >
                        {user.hasPaid ? "Paid" : "Free"}
                    </Badge>
                </div>
            </td>
            <td className="p-4 align-middle">
                <div className="flex flex-col">
                    <span className="text-sm">
                        Last Login: {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'PPp') : 'Never'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        Last Seen: {user.lastSeen ? format(new Date(user.lastSeen), 'PPp') : 'N/A'}
                    </span>
                </div>
            </td>
            <td className="p-4 align-middle">
                <div className="flex flex-col">
                    <span className="text-sm">
                        Created: {user.createdAt ? format(new Date(user.createdAt), 'PPp') : 'N/A'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        Time Online: {formatDuration(user.totalTimeOnline)}
                    </span>
                </div>
            </td>
            <td className="p-4 align-middle">
                <div className="flex flex-col">
                    <span className="text-sm">
                        Subscribed: {user.isSubscribedToEmails ? "Yes" : "No"}
                    </span>
                </div>
            </td>
            <td className="p-4 align-middle text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                    >
                        <Link to={`/studio/users/${user.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                            <span className="sr-only">View details</span>
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:text-destructive"
                        onClick={() => onDelete(user.id!)}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </div>
            </td>
        </tr>
    );
} 
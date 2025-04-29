import { useGetApiUsers } from "@/api/hooks/api";
import { useState } from "react";
import { usePostApiMarketingCampaignsIdRecipients } from "@/api/hooks/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { UserDTO } from "@/api/models/userDTO";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useToast } from "@/shared/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type SortField = "email" | "lastSeen" | null;

interface FilterState {
  isActive: boolean | null;
  hasPaid: boolean | null;
  lastSeenAfter: string | null;
  lastSeenBefore: string | null;
  createdAfter: string | null;
  createdBefore: string | null;
}

interface AddUsersDialogProps {
  campaignId: string;
  onUsersAdded: () => void;
}

export const AddUsersDialog = ({ campaignId, onUsersAdded }: AddUsersDialogProps) => {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy] = useState<SortField | null>(null);
  const [sortDescending, setSortDescending] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [filters, setFilters] = useState<FilterState>({
    isActive: null,
    hasPaid: null,
    lastSeenAfter: null,
    lastSeenBefore: null,
    createdAfter: null,
    createdBefore: null,
  });
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const { data: userList, isLoading } = useGetApiUsers({
    Page: page,
    PageSize: pageSize,
    SearchTerm: searchTerm || undefined,
    SortBy: sortBy === null ? undefined : sortBy,
    SortDescending: sortDescending,
    IsActive: filters.isActive || undefined,
    HasPaid: filters.hasPaid || undefined,
    LastLoginFrom: filters.lastSeenAfter || undefined,
    LastLoginTo: filters.lastSeenBefore || undefined,
    CreatedFrom: filters.createdAfter || undefined,
    CreatedTo: filters.createdBefore || undefined,
  });

  const addRecipients = usePostApiMarketingCampaignsIdRecipients({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Users added",
          description: "The selected users have been added to the campaign.",
        });
        setIsOpen(false);
        onUsersAdded();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add users to the campaign.",
          variant: "destructive",
        });
      },
    },
  });

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleAddUsers = () => {
    // Clear page when adding users
    setPage(1);

    if (selectedUsers.size === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to add to the campaign.",
        variant: "destructive",
      });
      return;
    }

    addRecipients.mutate({
      id: campaignId,
      data: {
        userIds: Array.from(selectedUsers),
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Recipients</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Recipients to Campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select
                value={filters.isActive?.toString() ?? "all"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value === "all" ? null : value === "true" }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Activity Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.hasPaid?.toString() ?? "all"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, hasPaid: value === "all" ? null : value === "true" }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment</SelectItem>
                  <SelectItem value="true">Paid</SelectItem>
                  <SelectItem value="false">Not Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Last Seen Range</div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="text-xs text-muted-foreground">From</div>
                  <Input
                    type="datetime-local"
                    value={filters.lastSeenAfter || ""}
                    onChange={(e) => setFilters(prev => ({ ...prev, lastSeenAfter: e.target.value || null }))}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-xs text-muted-foreground">To</div>
                  <Input
                    type="datetime-local"
                    value={filters.lastSeenBefore || ""}
                    onChange={(e) => setFilters(prev => ({ ...prev, lastSeenBefore: e.target.value || null }))}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Created Range</div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="text-xs text-muted-foreground">From</div>
                  <Input
                    type="datetime-local"
                    value={filters.createdAfter || ""}
                    onChange={(e) => setFilters(prev => ({ ...prev, createdAfter: e.target.value || null }))}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-xs text-muted-foreground">To</div>
                  <Input
                    type="datetime-local"
                    value={filters.createdBefore || ""}
                    onChange={(e) => setFilters(prev => ({ ...prev, createdBefore: e.target.value || null }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setFilters({
                  isActive: null,
                  hasPaid: null,
                  lastSeenAfter: null,
                  lastSeenBefore: null,
                  createdAfter: null,
                  createdBefore: null,
                })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userList?.items?.map((user: UserDTO) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer"
                    onClick={() => toggleUserSelection(user.id!)}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id!)}
                        onChange={() => toggleUserSelection(user.id!)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.lastSeen?.toString() || "Never"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {userList && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{userList.items?.length ?? 0}</span> of{" "}
                <span className="font-medium">{userList.totalCount ?? 0}</span> users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={!userList.items?.length || userList.items.length < pageSize || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={addRecipients.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUsers}
              disabled={selectedUsers.size === 0 || addRecipients.isPending}
            >
              Add Selected Users
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

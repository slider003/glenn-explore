import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../shared/StatusBadge';
import { CampaignDTO } from '@/api/models';

export const CampaignList = () => {
  const { campaigns = [], isLoading } = useCampaigns();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="text-muted-foreground">Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Email Campaigns</h2>
        <Button onClick={() => navigate('/studio/marketing/campaigns/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-muted-foreground">
          No campaigns found. Create your first one!
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign: CampaignDTO) => (
              <TableRow
                key={campaign.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/studio/marketing/campaigns/${campaign.id}`)}
              >
                <TableCell>{campaign.name}</TableCell>
                <TableCell>{campaign.emailTemplate?.name || 'None'}</TableCell>
                <TableCell>
                  <StatusBadge status={campaign.status} />
                </TableCell>
                <TableCell>{campaign.recipients?.length || 0}</TableCell>
                <TableCell>
                  {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

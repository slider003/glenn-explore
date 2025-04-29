import { useNavigate } from 'react-router-dom';
import { CampaignForm } from '../components/campaigns/CampaignForm';
import { useCampaigns } from '../hooks/useCampaigns';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const NewCampaignPage = () => {
  const navigate = useNavigate();
  const { createCampaign, isCreating } = useCampaigns();

  const handleSubmit = async (data: any) => {
    try {
      const campaign = await createCampaign(data);
      navigate(`/studio/marketing/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/studio/marketing/campaigns')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <p className="text-muted-foreground">Set up your email campaign</p>
      </div>

      <div className="max-w-2xl">
        <CampaignForm onSubmit={handleSubmit} isSubmitting={isCreating} />
      </div>
    </div>
  );
};

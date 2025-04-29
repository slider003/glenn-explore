import { useQueryClient } from '@tanstack/react-query';
import { CampaignDTO, CreateCampaignRequestDTO } from '@/api/models';
import {
  useGetApiMarketingCampaigns,
  usePostApiMarketingCampaigns,
  usePutApiMarketingCampaignsId,
  useDeleteApiMarketingCampaignsId,
} from '../../../api/hooks/api';

export const useCampaigns = () => {
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useGetApiMarketingCampaigns();

  const { mutateAsync: createCampaign, isPending: isCreating } = usePostApiMarketingCampaigns({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getApiMarketingCampaigns'] });
      },
    },
  });

  const { mutateAsync: updateCampaign, isPending: isUpdating } = usePutApiMarketingCampaignsId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getApiMarketingCampaigns'] });
      },
    },
  });

  const { mutateAsync: deleteCampaign, isPending: isDeleting } = useDeleteApiMarketingCampaignsId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getApiMarketingCampaigns'] });
      },
    },
  });

  return {
    campaigns,
    isLoading,
    createCampaign: (data: Omit<CreateCampaignRequestDTO, 'userIds'> & { userIds: string[] }) => 
      createCampaign({ data }),
    isCreating,
    updateCampaign: (id: string, data: CampaignDTO) => updateCampaign({ id, data }),
    isUpdating,
    deleteCampaign: (id: string) => deleteCampaign({ id }),
    isDeleting,
  };
};

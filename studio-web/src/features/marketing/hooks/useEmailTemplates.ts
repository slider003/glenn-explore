import { useQueryClient } from '@tanstack/react-query';
import { useGetApiMarketingTemplates, usePostApiMarketingTemplates, usePutApiMarketingTemplatesId } from '../../../api/hooks/api';
import { EmailTemplateDTO } from '@/api/models';

export const useEmailTemplates = () => {
  const queryClient = useQueryClient();
  
  const { data: templates = [], isLoading } = useGetApiMarketingTemplates();
  
  const createMutation = usePostApiMarketingTemplates({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getApiMarketingTemplates'] });
      },
    },
  });
  
  const updateMutation = usePutApiMarketingTemplatesId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getApiMarketingTemplates'] });
      },
    },
  });
  
  const createTemplate = async (data: EmailTemplateDTO) => {
    return createMutation.mutateAsync({
      data: {
        ...data,
        id: '', // Will be set by backend
        createdAt: new Date().toISOString(),
      },
    });
  };
  
  const updateTemplate = async (id: string, data: EmailTemplateDTO) => {
    return updateMutation.mutateAsync({
      id,
      data: {
        ...data,
        id,
        createdAt: new Date().toISOString(),
      },
    });
  };
  
  return {
    templates,
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    createTemplate,
    updateTemplate,
  };
};

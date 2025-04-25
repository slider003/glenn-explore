import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/shared/components/ui/use-toast';
import { useGetApiModelsAdminModelId, usePutApiModelsModelId } from '@/api/hooks/api';
import { PublicModelForm } from '../components/public-model-form/public-model-form';
import { CreateModelRequestDTO, UpdateModelRequestDTO } from '@/api/models';
import { Loader2 } from 'lucide-react';

export const EditPublicModelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: model, isLoading } = useGetApiModelsAdminModelId(id!, {
    query: {
      staleTime: 0, // Consider data stale immediately
      gcTime: 0, // Remove data from cache immediately
    }
  });
  const { mutateAsync: updateModel, isPending } = usePutApiModelsModelId();

  const handleSubmit = async (data: UpdateModelRequestDTO) => {
    if (!id) return;

    try {
      await updateModel({ modelId: id, data });
      toast({
        title: 'Success',
        description: 'Model updated successfully',
      });
      navigate('/studio/public-models');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update model',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-destructive">Model not found</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Edit Model</h1>
          <p className="text-muted-foreground text-lg">
            Update your 3D model details
          </p>
        </div>

        {model ? <PublicModelForm
          initialData={model}
          onSubmit={handleSubmit as (data: CreateModelRequestDTO | UpdateModelRequestDTO) => Promise<void>}
          isLoading={isPending}
        /> : null}
      </div>
    </div>
  );
};

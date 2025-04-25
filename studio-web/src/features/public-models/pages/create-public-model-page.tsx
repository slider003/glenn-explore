
import { useNavigate } from 'react-router-dom';
import { PublicModelForm } from '../components/public-model-form/public-model-form';
import { usePostApiModels } from '@/api/hooks/api';
import { toast } from '@/shared/components/ui/use-toast';

export function CreatePublicModelPage() {
  const navigate = useNavigate();
  const createModel = usePostApiModels();

  const handleSubmit = async (data: any) => {
    try {
      await createModel.mutateAsync({
        data: {
          ...data,
          isPremium: false, // Public models are never premium
        },
      });
      toast({
        title: 'Success',
        description: 'Your model has been created successfully!',
      });
      navigate('/studio/public-models'); // Redirect to the public models list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create model. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Public Model</h1>
        <p className="text-muted-foreground mt-2">
          Create a new model that anyone can use in the game. Choose between a car or character,
          customize its appearance, and set its basic properties.
        </p>
      </div>

      <PublicModelForm onSubmit={handleSubmit} isLoading={createModel.isPending} />
    </div>
  );
}

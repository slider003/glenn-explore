import { Link } from 'react-router-dom';
import { useGetApiModelsMyModels } from '@/api/hooks/api';
import { Button } from '@/shared/components/ui/button';
import { ModelDetailsDtoDTO } from '@/api/models';

function ModelCard({ model }: { model: ModelDetailsDtoDTO & { id: string } }) {
  return (
    <Link 
      to={`/studio/public-models/edit/${model.modelId}`}
      className="block group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {model.thumbnailUrl && (
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={model.thumbnailUrl || ''}
            alt={model.name || ''}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{model.name}</h3>
          <span className="text-sm text-muted-foreground">
            {model.type === 'car' ? '🚗' : '🚶'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PublicModelsPage() {
  const { data: models, isPending } = useGetApiModelsMyModels({});
  const publicModels = (models || []) as (ModelDetailsDtoDTO & { id: string })[];

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your models</h1>
          <p className="text-muted-foreground mt-2">
            These are the models you have uploaded
          </p>
        </div>
        <Button asChild>
          <Link to="/studio/public-models/create">Create Model</Link>
        </Button>
      </div>

      {isPending ? (
        <div className="text-center py-8">Loading models...</div>
      ) : publicModels.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No models found</p>
          <Button asChild className="mt-4">
            <Link to="/studio/public-models/create">Create the First Model</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {publicModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}

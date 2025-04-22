import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Plus, Loader2, Search } from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';
import { useGetApiModelsAdminAll, usePostApiModelsAdminModelIdToggleActive } from '@/api/hooks/api';
import { ModelItem } from './model-item';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils/utils';
import { Switch } from '@/shared/components/ui/switch';

type SortField = 'name' | 'createdAt' | 'price';
type SortOrder = 'asc' | 'desc';

export const ModelList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [modelToToggle, setModelToToggle] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [sortField, setSortField] = React.useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');
  const [showActiveOnly, setShowActiveOnly] = React.useState(true);

  const {
    data: models,
    isLoading,
    isError,
    refetch,
  } = useGetApiModelsAdminAll({});

  const { mutateAsync: toggleActive } = usePostApiModelsAdminModelIdToggleActive();

  const handleDelete = async (id: string) => {
    setModelToToggle(id);
  };

  const confirmDelete = async () => {
    if (!modelToToggle) return;

    try {
      await toggleActive({ modelId: modelToToggle });
      const model = models?.find(m => m.modelId === modelToToggle);
      toast({
        title: 'Success',
        description: `Model ${model?.isActive ? 'deactivated' : 'activated'} successfully`,
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle model status',
        variant: 'destructive',
      });
    } finally {
      setModelToToggle(null);
    }
  };

  const handleCreate = () => {
    navigate('/studio/models/create');
  };

  const handleEdit = (id: string) => {
    navigate(`/studio/models/${id}`);
  };

  const filteredAndSortedModels = React.useMemo(() => {
    if (!models) return [];

    let filtered = [...models];

    // Apply active filter
    if (showActiveOnly) {
      filtered = filtered.filter(model => model.isActive);
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(model => model.type === selectedType);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(model =>
        model.name?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'createdAt':
          // Since we don't have updatedAt in ModelInfoDtoDTO, we'll sort by name as fallback
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [models, selectedType, searchQuery, sortField, sortOrder, showActiveOnly]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-destructive">Error loading models</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Models</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Model
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="car">Cars</SelectItem>
            <SelectItem value="walking">Characters</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="createdAt">Created Date</SelectItem>
            <SelectItem value="price">Price</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>

        <div className="flex items-center gap-2">
          <Switch
            checked={showActiveOnly}
            onCheckedChange={setShowActiveOnly}
            id="active-filter"
          />
          <label
            htmlFor="active-filter"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            Active Only
          </label>
        </div>
      </div>
      
      {filteredAndSortedModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedModels.map((model) => (
            <ModelItem
              key={model.modelId}
              model={model}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">No models found</p>
        </div>
      )}

      <AlertDialog open={!!modelToToggle} onOpenChange={() => setModelToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {models?.find(m => m.modelId === modelToToggle)?.isActive 
                ? 'Deactivate Model' 
                : 'Activate Model'
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {models?.find(m => m.modelId === modelToToggle)?.isActive ? 'deactivate' : 'activate'} this model?
              {models?.find(m => m.modelId === modelToToggle)?.isActive && (
                ' This will make it unavailable to users.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className={cn(
                models?.find(m => m.modelId === modelToToggle)?.isActive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-green-600 text-white hover:bg-green-700"
              )}
            >
              {models?.find(m => m.modelId === modelToToggle)?.isActive ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 
import React from 'react';
import { ModelDetailsDtoDTO } from '@/api/models';
import { formatFileSize, formatDate } from '@/utils/formatters';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  Pencil,
  Trash2,
  Car,
  User,
  Image as ImageIcon,
  FileCode,
  Eye,
  DollarSign,
  Power,
  PowerOff
} from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface ModelItemProps {
  model: ModelDetailsDtoDTO;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ModelItem: React.FC<ModelItemProps> = ({ model, onEdit, onDelete }) => {
  const hasThumbnail = !!model.thumbnailUrl;
  const hasModelFile = !!model.modelUrl;

  const getTypeIcon = () => {
    switch (model.type?.toLowerCase()) {
      case 'car':
        return <Car className="h-12 w-12 text-muted-foreground" />;
      case 'walking':
        return <User className="h-12 w-12 text-muted-foreground" />;
      default:
        return <FileCode className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getTypeLabel = () => {
    switch (model.type?.toLowerCase()) {
      case 'car':
        return 'Vehicle';
      case 'walking':
        return 'Character';
      default:
        return 'Other';
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Preview Section */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {hasThumbnail ? (
          <img
            src={model.thumbnailUrl!}
            alt={model.name || 'Model preview'}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            {getTypeIcon()}
          </div>
        )}
        
        {/* Status badges */}
        <div className="absolute top-2 right-2 flex gap-2">
          {model.isPremium && (
            <Badge variant="default" className="bg-primary/90 text-primary-foreground">
              <DollarSign className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
          <Badge
            variant={model.isActive ? "default" : "destructive"}
            className={cn(
              "text-sm font-medium",
              model.isActive 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-destructive/90 hover:bg-destructive text-destructive-foreground"
            )}
          >
            {model.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white"
            onClick={() => onEdit(model.modelId!)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          {hasModelFile && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white"
              asChild
            >
              <a href={model.modelUrl!} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </a>
            </Button>
          )}
          <Button
            variant={model.isActive ? "destructive" : "default"}
            size="sm"
            className={cn(
              "text-white",
              model.isActive 
                ? "bg-red-500/70 hover:bg-red-500" 
                : "bg-green-600/70 hover:bg-green-600"
            )}
            onClick={() => onDelete(model.modelId!)}
          >
            {model.isActive ? (
              <>
                <PowerOff className="h-4 w-4 mr-1" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-1" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Info Section */}
      <div className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium truncate">
                {model.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getTypeIcon()}
                <span>{getTypeLabel()}</span>
              </div>
            </div>
            {model.isPremium && (
              <div className="text-primary font-medium">
                ${model.price?.toFixed(2)}
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {hasThumbnail && (
              <Badge variant="outline" className="text-xs">
                <ImageIcon className="h-3 w-3 mr-1" />
                Thumbnail
              </Badge>
            )}
            {hasModelFile && (
              <Badge variant="outline" className="text-xs">
                <FileCode className="h-3 w-3 mr-1" />
                Model File
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}; 
import React from 'react';
import { FileInfoDtoDTO } from '@/api/models';
import { formatFileSize, formatDate } from '@/utils/formatters';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Trash2, Download, Image as ImageIcon } from 'lucide-react';

interface FileItemProps {
  file: FileInfoDtoDTO;
  onDelete: (id: string) => void;
}

export const FileItem: React.FC<FileItemProps> = ({ file, onDelete }) => {
  const isImage = file.mimeType?.startsWith('image/');

  return (
    <Card className="p-4 hover:shadow-md transition-all">
      <div className="flex flex-col gap-4">
        {/* Preview Section */}
        {isImage && file.path && (
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
            <img
              src={file.path}
              alt={file.name || 'Image preview'}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        
        {/* Info Section */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {isImage ? (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Download className="h-4 w-4 text-muted-foreground" />
              )}
              <p className="font-medium truncate">
                {file.name}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {file.size ? formatFileSize(file.size) : '0 B'}
            </p>
            <p className="text-sm text-muted-foreground">
              {file.uploadedAt ? formatDate(file.uploadedAt) : '-'}
            </p>
          </div>
          
          <div className="flex gap-2">
            {file.path && (
              <Button
                variant="ghost"
                size="icon"
                className="text-primary"
                asChild
              >
                <a href={file.path} download={file.name} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => onDelete(file.id || '')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}; 
import React from 'react';
import { useToast } from '@/shared/components/ui/use-toast';
import { usePostApiFiles } from '@/api/hooks/api';
import { FileUpload } from '@/features/files/components/file-list/file-upload';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/utils';

interface ModelUploadProps {
  thumbnailUrl?: string | null;
  modelUrl?: string | null;
  onThumbnailChange: ({id, url}: {id: string, url: string}) => void;
  onModelChange: ({id, url}: {id: string, url: string}) => void;
}

export const ModelUpload: React.FC<ModelUploadProps> = ({
  thumbnailUrl,
  modelUrl,
  onThumbnailChange,
  onModelChange,
}) => {
  const { toast } = useToast();
  const { mutateAsync: uploadFile } = usePostApiFiles();

  const handleModelFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.glb')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a .glb file',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await uploadFile({ 
        data: {
          file: file as unknown as Blob
        }
      });
      if (response.path) {
        onModelChange({id: response.id!, url: response.path});
        toast({
          title: 'Success',
          description: 'Model file uploaded successfully',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload model file',
        variant: 'destructive',
      });
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    try {
      const response = await uploadFile({ 
        data: {
          file: file as unknown as Blob
        }
      });
      if (response.path) {
        onThumbnailChange({id: response.id!, url: response.path});
        toast({
          title: 'Success',
          description: 'Thumbnail uploaded successfully',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload thumbnail',
        variant: 'destructive',
      });
    }
  };

  const UploadSection = ({ 
    title, 
    description, 
    acceptedTypes, 
    maxSize, 
    currentFile,
    onUpload,
    icon
  }: { 
    title: string;
    description: string;
    acceptedTypes: string[];
    maxSize: number;
    currentFile?: string | null;
    onUpload: (file: File) => Promise<void>;
    icon: React.ReactNode;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        
        <div className={cn(
          "relative group cursor-pointer",
          "transition-all duration-300 ease-in-out",
          "rounded-xl border-2 border-dashed",
          "hover:border-primary/50 hover:bg-muted/50",
          currentFile ? "border-border/50 bg-muted/30" : "border-border/30"
        )}>
          <FileUpload
            onUploadComplete={onUpload}
            acceptedFileTypes={acceptedTypes}
            maxSize={maxSize}
            currentFile={currentFile}
            className="p-8"
          />
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="text-primary/70 font-medium">
              Click to browse or drag and drop
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <UploadSection
        title="Model File"
        description="Upload your 3D model file (.glb format)"
        acceptedTypes={['model/gltf-binary', 'application/octet-stream']}
        maxSize={15 * 1024 * 1024}
        currentFile={modelUrl}
        onUpload={handleModelFileUpload}
        icon={
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
        }
      />

      <UploadSection
        title="Thumbnail"
        description="Upload a preview image for your model"
        acceptedTypes={['image/jpeg', 'image/png']}
        maxSize={5 * 1024 * 1024}
        currentFile={thumbnailUrl}
        onUpload={handleThumbnailUpload}
        icon={
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        }
      />
    </div>
  );
}; 
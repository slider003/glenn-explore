import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/shared/components/ui/use-toast';
import { Card } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { usePostApiFiles } from '@/api/hooks/api';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/utils';

interface FileUploadProps {
  onUploadComplete: (file: File) => void | Promise<void>;
  acceptedFileTypes?: string[];
  maxSize?: number;
  currentFile?: string | null;
  className?: string;
}

const DEFAULT_MAX_SIZE = 15 * 1024 * 1024; // 15MB

type MimeTypeMap = {
  'image/jpeg': string[];
  'image/png': string[];
  'model/gltf-binary': string[];
  'application/octet-stream': string[];
};

const MIME_TYPES: MimeTypeMap = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  // 3D Models
  'model/gltf-binary': ['.glb'],
  'application/octet-stream': ['.glb'] // Fallback for GLB
};

const DEFAULT_ACCEPTED_TYPES = Object.keys(MIME_TYPES) as (keyof MimeTypeMap)[];

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  currentFile,
  className
}) => {
  const { toast } = useToast();
  const { mutateAsync: uploadFile, isPending } = usePostApiFiles();
  const isImage = currentFile && acceptedFileTypes.some(type => type.startsWith('image/'));

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;

    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${maxSize / (1024 * 1024)}MB`,
        variant: 'destructive',
      });
      return;
    }

    // Check if file type is accepted
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isAcceptedType = acceptedFileTypes.some(type => 
      MIME_TYPES[type as keyof MimeTypeMap]?.includes(fileExtension)
    );

    if (!isAcceptedType) {
      toast({
        title: 'Invalid file type',
        description: `Only ${acceptedFileTypes.join(', ')} files are allowed`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await uploadFile({ data: { file } });
      toast({
        title: 'Success',
        description: 'Your file has been uploaded successfully',
      });
      onUploadComplete(file);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error uploading your file',
        variant: 'destructive',
      });
    }
  }, [uploadFile, toast, onUploadComplete, maxSize, acceptedFileTypes]);

  // Create accept object for dropzone in the format they expect
  const accept = acceptedFileTypes.reduce<Record<string, string[]>>((acc, mimeType) => {
    acc[mimeType] = MIME_TYPES[mimeType as keyof MimeTypeMap];
    return acc;
  }, {});

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
    accept,
    maxSize,
  });

  return (
    <div className={cn("relative", className)}>
      <Card
        {...getRootProps()}
        className={`p-6 border-2 border-dashed cursor-pointer transition-all hover:border-primary ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {currentFile ? (
            <>
              {isImage && (
                <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md bg-muted">
                  <img
                    src={currentFile}
                    alt="File preview"
                    className="object-contain w-full h-full"
                  />
                </div>
              )}
              <div className="flex flex-col items-center gap-2 w-full max-w-md">
                <span className="text-sm text-muted-foreground">Current file URL:</span>
                <Input 
                  value={currentFile} 
                  readOnly 
                  className="text-sm font-mono"
                  onClick={(e) => e.stopPropagation()}
                />
                <a 
                  href={currentFile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View file
                </a>
              </div>
            </>
          ) : (
            <p className={`text-center ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`}>
              {isDragActive
                ? 'Drop the file here'
                : 'Drag and drop a file here, or click to select'}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Supported: {acceptedFileTypes.join(', ')} (max {maxSize / (1024 * 1024)}MB)
          </p>
        </div>
        {isPending && (
          <Progress value={33} className="mt-4" />
        )}
      </Card>
    </div>
  );
};
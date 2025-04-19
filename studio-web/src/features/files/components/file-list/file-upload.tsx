import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/shared/components/ui/use-toast';
import { Card } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { usePostApiFiles } from '@/api/hooks/api';

interface FileUploadProps {
  onUploadComplete: () => void;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = ['model/gltf-binary', 'image/jpeg', 'image/png'];

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const { toast } = useToast();
  const { mutateAsync: uploadFile, isPending } = usePostApiFiles();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 15MB',
        variant: 'destructive',
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only .glb, .jpg, and .png files are allowed',
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
      onUploadComplete();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error uploading your file',
        variant: 'destructive',
      });
    }
  }, [uploadFile, toast, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
  });

  return (
    <Card
      {...getRootProps()}
      className={`p-6 border-2 border-dashed cursor-pointer transition-all hover:border-primary ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <p className={`text-center ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`}>
          {isDragActive
            ? 'Drop the file here'
            : 'Drag and drop a file here, or click to select'}
        </p>
        <p className="text-sm text-muted-foreground">
          Supported: .glb, .jpg, .png (max 15MB)
        </p>
      </div>
      {isPending && (
        <Progress value={33} className="mt-4" />
      )}
    </Card>
  );
}; 
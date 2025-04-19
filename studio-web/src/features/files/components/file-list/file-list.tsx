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
import { Loader2 } from 'lucide-react';
import { useGetApiFiles, useDeleteApiFilesId } from '@/api/hooks/api';
import { FileItem } from './file-item';
import { FileUpload } from './file-upload';

export const FileList: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<string | null>(null);

  const {
    data: files,
    isLoading,
    isError,
    refetch,
  } = useGetApiFiles({});

  const { mutateAsync: deleteFile } = useDeleteApiFilesId();

  const handleDelete = async (id: string) => {
    setFileToDelete(id);
    setIsOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      await deleteFile({ id: fileToDelete });
      refetch();
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally {
      setIsOpen(false);
      setFileToDelete(null);
    }
  };

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
        <p className="text-destructive">Error loading files</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <FileUpload onUploadComplete={refetch} />
      
      {files && files.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">No files uploaded yet</p>
        </div>
      )}

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 
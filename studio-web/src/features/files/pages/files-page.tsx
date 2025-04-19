import React from 'react';
import { FileList } from '../components/file-list/file-list';

export const FilesPage: React.FC = () => {
  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Files</h1>
          <p className="text-muted-foreground">
            Upload and manage your files
          </p>
        </div>
        
        <FileList />
      </div>
    </div>
  );
}; 
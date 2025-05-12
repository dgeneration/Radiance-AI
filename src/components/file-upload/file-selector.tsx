"use client";

import { useState } from 'react';
import { FileMetadata } from '@/utils/supabase/file-storage';
import { Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileManager } from './file-manager';
import Image from 'next/image';

interface FileSelectorProps {
  userId: string;
  onFilesSelected: (files: FileMetadata[]) => void;
  selectedFiles: FileMetadata[];
  multiple?: boolean;
}

export function FileSelector({ userId, onFilesSelected, selectedFiles, multiple = true }: FileSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleFileSelection = (files: FileMetadata[]) => {
    onFilesSelected(files);
    setDialogOpen(false);
  };

  const removeFile = (fileId: string) => {
    onFilesSelected(selectedFiles.filter(file => file.id !== fileId));
  };

  const getFileIcon = (file: FileMetadata) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 text-primary" />;
    }
    return <FileText className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="space-y-3">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-card/50 border-primary/20 hover:bg-primary/5"
          >
            <Paperclip className="h-4 w-4" />
            {selectedFiles.length > 0 
              ? `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected` 
              : 'Attach files'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Files</DialogTitle>
          </DialogHeader>
          <FileManager
            userId={userId}
            selectable={true}
            onSelect={handleFileSelection}
            multiple={multiple}
          />
        </DialogContent>
      </Dialog>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Attached Files</div>
          <div className="space-y-2">
            {selectedFiles.map((file) => (
              <div 
                key={file.id}
                className="flex items-center justify-between p-2 bg-card/50 backdrop-blur-sm border border-primary/10 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  {file.type.startsWith('image/') ? (
                    <div className="relative h-8 w-8 rounded overflow-hidden">
                      <Image
                        src={file.public_url || ''}
                        alt={file.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                      {getFileIcon(file)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

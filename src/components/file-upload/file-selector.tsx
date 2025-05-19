"use client";

import { useState } from 'react';
import { FileMetadata } from '@/utils/supabase/file-storage';
import { Paperclip, X, FileText, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileManager } from './file-manager';
import { ProfessionalButton } from '@/components/ui/professional-button';
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
          <ProfessionalButton
            variant="outline"
            size="sm"
            icon={<Upload className="h-4 w-4" />}
            iconPosition="left"
            className="shadow-sm hover:shadow-md transition-all duration-300"
          >
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} attached`
              : 'Attach Medical Reports'}
          </ProfessionalButton>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-card/90 backdrop-blur-md border-primary/20">
          <DialogHeader>
            <DialogTitle className="m-0 p-0">
              <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-xl md:text-2xl">
                Select Medical Reports
              </span>
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Choose medical reports, test results, or images to include with your diagnosis request
            </p>
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Paperclip className="h-3 w-3 text-primary" />
            </div>
            <div className="text-sm font-medium bg-gradient-to-r from-primary/90 to-accent/90 bg-clip-text text-transparent">
              Attached Medical Reports
            </div>
          </div>
          <div className="space-y-2 bg-card/30 backdrop-blur-sm border border-primary/10 rounded-xl p-3">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2.5 bg-card/50 backdrop-blur-sm border border-primary/10 rounded-lg hover:bg-card/70 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  {file.type.startsWith('image/') ? (
                    <div className="relative h-10 w-10 rounded-md overflow-hidden border border-primary/10">
                      {file.public_url?.startsWith('blob:') ? (
                        <Image
                          src={file.public_url}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={file.public_url || ''}
                          alt={file.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 border border-primary/10">
                      {getFileIcon(file)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-3.5 w-3.5" />
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

"use client";

import { useState, useEffect } from 'react';
import { FileMetadata, getUserFiles, deleteFile } from '@/utils/supabase/file-storage';
import { FileText, Image as ImageIcon, Trash2, Download, Eye, X, Check, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { FileUploadDropzone } from './file-upload-dropzone';
import { ProfessionalButton } from '@/components/ui/professional-button';
import { AnimatedCard } from '@/components/dashboard';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface FileManagerProps {
  userId: string;
  selectable?: boolean;
  onSelect?: (files: FileMetadata[]) => void;
  multiple?: boolean;
}

export function FileManager({ userId, selectable = false, onSelect, multiple = true }: FileManagerProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, [userId]);

  const loadFiles = async () => {
    setLoading(true);
    const userFiles = await getUserFiles(userId);
    setFiles(userFiles);
    setLoading(false);
  };

  const handleUploadComplete = (newFiles: FileMetadata[]) => {
    setFiles(prev => [...newFiles, ...prev]);
  };

  const handleDeleteFile = async (fileId: string) => {
    const success = await deleteFile(fileId, userId);
    if (success) {
      setFiles(prev => prev.filter(file => file.id !== fileId));
      setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
    }
  };

  const toggleFileSelection = (file: FileMetadata) => {
    if (!selectable) return;

    if (multiple) {
      // For multiple selection
      const isSelected = selectedFiles.some(f => f.id === file.id);
      if (isSelected) {
        setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
      } else {
        setSelectedFiles(prev => [...prev, file]);
      }
    } else {
      // For single selection
      setSelectedFiles([file]);
    }
  };

  const confirmSelection = () => {
    if (onSelect) {
      onSelect(selectedFiles);
    }
  };

  const filteredFiles = files.filter(file => {
    // Filter by search query
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by file type
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'images') return file.type.startsWith('image/') && matchesSearch;
    if (activeTab === 'documents') return !file.type.startsWith('image/') && matchesSearch;

    return matchesSearch;
  });

  const getFileIcon = (file: FileMetadata) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6 text-primary" />;
    }
    return <FileText className="h-6 w-6 text-primary" />;
  };

  const renderFilePreview = () => {
    if (!previewFile) return null;

    if (previewFile.type.startsWith('image/')) {
      return (
        <div className="relative h-full w-full flex items-center justify-center">
          <Image
            src={previewFile.public_url || ''}
            alt={previewFile.name}
            width={600}
            height={400}
            className="max-h-[70vh] w-auto object-contain"
          />
        </div>
      );
    }

    // For non-image files, show a download link
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FileText className="h-20 w-20 text-primary mb-4" />
        <p className="text-lg font-medium mb-6">{previewFile.name}</p>
        <p className="text-sm text-muted-foreground mb-8">
          This file type cannot be previewed directly.
        </p>
        <ProfessionalButton
          variant="primary"
          size="lg"
          icon={<Download className="h-5 w-5" />}
          iconPosition="left"
          onClick={() => window.open(previewFile.public_url || '', '_blank')}
        >
          Download File
        </ProfessionalButton>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <ProfessionalButton
              variant="primary"
              size="default"
              icon={<Upload className="h-4 w-4" />}
              iconPosition="left"
            >
              Upload Files
            </ProfessionalButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
            </DialogHeader>
            <FileUploadDropzone
              userId={userId}
              onUploadComplete={(newFiles) => {
                handleUploadComplete(newFiles);
              }}
              multiple={true}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {renderFileGrid(filteredFiles)}
        </TabsContent>
        <TabsContent value="images" className="mt-4">
          {renderFileGrid(filteredFiles)}
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          {renderFileGrid(filteredFiles)}
        </TabsContent>
      </Tabs>

      {selectable && selectedFiles.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card/90 backdrop-blur-md border border-primary/20 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
            <ProfessionalButton
              variant="outline"
              size="sm"
              onClick={() => setSelectedFiles([])}
            >
              Clear
            </ProfessionalButton>
            <ProfessionalButton
              variant="primary"
              size="sm"
              icon={<Check className="h-4 w-4" />}
              iconPosition="left"
              onClick={confirmSelection}
            >
              Confirm Selection
            </ProfessionalButton>
          </div>
        </div>
      )}

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="sm:max-w-3xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
            <DialogClose className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {renderFilePreview()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderFileGrid(files: FileMetadata[]) {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading files...</span>
        </div>
      );
    }

    if (files.length === 0) {
      return (
        <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/5">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">
            {searchQuery ? 'No files match your search' : 'No files uploaded yet'}
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <ProfessionalButton
                variant="primary"
                size="lg"
                icon={<Upload className="h-5 w-5" />}
                iconPosition="left"
              >
                Upload Your First File
              </ProfessionalButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
              </DialogHeader>
              <FileUploadDropzone
                userId={userId}
                onUploadComplete={handleUploadComplete}
                multiple={true}
              />
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => {
          const isSelected = selectedFiles.some(f => f.id === file.id);
          const isImage = file.type.startsWith('image/');

          return (
            <AnimatedCard
              key={file.id}
              className={`relative overflow-hidden rounded-lg border ${
                isSelected ? 'border-primary' : 'border-primary/10'
              } bg-card/50 backdrop-blur-sm transition-all duration-200 ${
                selectable ? 'cursor-pointer' : ''
              }`}
              onClick={() => selectable && toggleFileSelection(file)}
            >
              {selectable && (
                <div className={`absolute top-2 right-2 z-10 h-5 w-5 rounded-full border ${
                  isSelected ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'
                } flex items-center justify-center`}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
              )}

              <div className="p-3">
                <div className="aspect-square w-full overflow-hidden rounded-md bg-primary/5 flex items-center justify-center">
                  {isImage ? (
                    <Image
                      src={file.public_url || ''}
                      alt={file.name}
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      <FileText className="h-12 w-12 text-primary/70" />
                      <span className="mt-2 text-xs text-muted-foreground uppercase">
                        {file.type.split('/')[1]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                  </p>
                </div>

                <div className="mt-3 flex justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile(file);
                    }}
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.public_url || '', '_blank');
                    }}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AnimatedCard>
          );
        })}
      </div>
    );
  }
}

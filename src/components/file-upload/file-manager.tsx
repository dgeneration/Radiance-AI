"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FileMetadata, getUserFiles, deleteFile, getSignedUrl, downloadFile } from '@/utils/supabase/file-storage';
import { FileText, Image as ImageIcon, Trash2, Download, Eye, X, Check, Search, Upload, FileJson, FileCode, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedSection, AnimatedIcon } from '@/components/animations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { FileUploadDropzone } from './file-upload-dropzone';
import { ProfessionalButton } from '@/components/ui/professional-button';
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<string[]>([]);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, [userId]);

  // Create refs for newly uploaded files
  const newFileRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Scroll to newly uploaded files when they appear
  useEffect(() => {
    // Only attempt to scroll if we have newly uploaded files and refs
    if (newlyUploadedFiles.length > 0 && Object.keys(newFileRefs.current).length > 0) {
      // Small delay to ensure the DOM has updated
      const scrollTimeout = setTimeout(() => {
        // Find the first newly uploaded file that has a ref
        const fileId = newlyUploadedFiles.find(id => newFileRefs.current[id]);

        if (fileId && newFileRefs.current[fileId]) {
          // Scroll to the file
          newFileRefs.current[fileId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);

      // Clean up the timeout
      return () => clearTimeout(scrollTimeout);
    }
  }, [newlyUploadedFiles, files]);

  const loadFiles = async () => {
    setLoading(true);
    const userFiles = await getUserFiles(userId);
    setFiles(userFiles);
    setLoading(false);
  };

  const handleUploadComplete = (newFiles: FileMetadata[]) => {
    // Add the new files to the beginning of the list
    setFiles(prev => [...newFiles, ...prev]);

    // Clear any existing refs
    newFileRefs.current = {};

    // Track the IDs of newly uploaded files
    setNewlyUploadedFiles(newFiles.map(file => file.id));

    // Show success message
    setShowUploadSuccess(true);

    // Set active tab to 'all' to ensure new files are visible
    setActiveTab('all');

    // Close the upload dialog
    setUploadDialogOpen(false);

    // Clear the "newly uploaded" status after 5 seconds
    setTimeout(() => {
      setNewlyUploadedFiles([]);
      setShowUploadSuccess(false);
    }, 5000);
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

  // We'll remove the unused function

  const renderFilePreview = () => {
    if (!previewFile) return null;

    // Handle image files
    if (previewFile.type.startsWith('image/')) {
      return (
        <div className="relative h-full w-full flex items-center justify-center">
          {previewBlob ? (
            // Use regular img tag for blob URLs since Next.js Image doesn't support them
            <Image
              src={previewBlob}
              alt={previewFile.name}
              className="max-h-[70vh] w-auto object-contain"
            />
          ) : (
            <Image
              src={previewUrl || previewFile.public_url || ''}
              alt={previewFile.name}
              width={600}
              height={400}
              sizes="(max-width: 768px) 100vw, 600px"
              className="max-h-[70vh] w-auto object-contain"
              onError={async () => {
                // If loading the image fails, try to download it directly and create a blob URL
                const blob = await downloadFile(previewFile.path);
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  setPreviewBlob(url);
                }
              }}
            />
          )}
        </div>
      );
    }

    // Handle PDF files
    if (previewFile.type === 'application/pdf' || previewFile.name.toLowerCase().endsWith('.pdf')) {
      const pdfUrl = previewUrl || previewFile.public_url;

      return (
        <div className="relative h-full w-full flex flex-col">
          {pdfUrl ? (
            <>
              <div className="w-full h-[65vh] bg-card/50 rounded-lg border border-primary/10 overflow-hidden">
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=1`}
                  className="w-full h-full"
                  title={previewFile.name}
                />
              </div>
              <div className="mt-4 flex justify-center gap-4">
                <ProfessionalButton
                  variant="outline"
                  size="sm"
                  icon={<Eye className="h-4 w-4" />}
                  iconPosition="left"
                  onClick={() => window.open(pdfUrl, '_blank')}
                >
                  Open in New Tab
                </ProfessionalButton>

                <ProfessionalButton
                  variant="primary"
                  size="sm"
                  icon={<Download className="h-4 w-4" />}
                  iconPosition="left"
                  onClick={async () => {
                    // Try to download the file directly
                    const blob = await downloadFile(previewFile.path);
                    if (blob) {
                      // Create a download link
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = previewFile.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } else {
                      // Fallback to opening the URL
                      window.open(pdfUrl, '_blank');
                    }
                  }}
                >
                  Download
                </ProfessionalButton>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <FileText className="h-20 w-20 text-primary mb-4" />
              <p className="text-lg font-medium mb-2">{previewFile.name}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Unable to preview this PDF file.
              </p>
              <ProfessionalButton
                variant="primary"
                size="lg"
                icon={<Download className="h-5 w-5" />}
                iconPosition="left"
                onClick={async () => {
                  // Try to download the file directly
                  const blob = await downloadFile(previewFile.path);
                  if (blob) {
                    // Create a download link
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = previewFile.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                Download File
              </ProfessionalButton>
            </div>
          )}
        </div>
      );
    }

    // Handle text files
    if (previewFile.type === 'text/plain' ||
        previewFile.name.toLowerCase().endsWith('.txt') ||
        previewFile.name.toLowerCase().endsWith('.md') ||
        previewFile.name.toLowerCase().endsWith('.json') ||
        previewFile.name.toLowerCase().endsWith('.csv')) {

      return (
        <div className="relative h-full w-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium">{previewFile.name}</p>
            <ProfessionalButton
              variant="outline"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              iconPosition="left"
              onClick={async () => {
                // Try to download the file directly
                const blob = await downloadFile(previewFile.path);
                if (blob) {
                  // Create a download link
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = previewFile.name;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } else {
                  // Fallback to opening the URL
                  window.open(previewUrl || previewFile.public_url || '', '_blank');
                }
              }}
            >
              Download
            </ProfessionalButton>
          </div>

          <TextFilePreview filePath={previewFile.path} />
        </div>
      );
    }

    // For other file types, show a download link
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
          onClick={async () => {
            // Try to download the file directly
            const blob = await downloadFile(previewFile.path);
            if (blob) {
              // Create a download link
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = previewFile.name;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } else {
              // Fallback to opening the URL
              window.open(previewUrl || previewFile.public_url || '', '_blank');
            }
          }}
        >
          Download File
        </ProfessionalButton>
      </div>
    );
  };

  // Component to fetch and display text file content
  const TextFilePreview = ({ filePath }: { filePath: string }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchTextContent = async () => {
        try {
          setLoading(true);
          setError(null);

          // Try to download the file directly
          const blob = await downloadFile(filePath);
          if (!blob) {
            throw new Error('Failed to download file');
          }

          // Read the blob as text
          const text = await blob.text();
          setContent(text);
        } catch (err: unknown) {
          console.error('Error fetching text content:', err);
          setError(err instanceof Error ? err.message : 'Failed to load text content');
        } finally {
          setLoading(false);
        }
      };

      fetchTextContent();
    }, [filePath]);

    if (loading) {
      return (
        <div className="w-full h-[50vh] bg-card/50 rounded-lg border border-primary/10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full h-[50vh] bg-card/50 rounded-lg border border-primary/10 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading text content</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-[50vh] bg-card/50 rounded-lg border border-primary/10 overflow-auto">
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words text-foreground">
          {content}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">

      <AnimatedSection direction="down" delay={0.1}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 backdrop-blur-sm border-primary/10 focus:border-primary/30 transition-all duration-300"
            />
          </div>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <ProfessionalButton
                variant="primary"
                size="default"
                icon={<Upload className="h-4 w-4" />}
                iconPosition="left"
                onClick={() => setUploadDialogOpen(true)}
                className="shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                Upload Files
              </ProfessionalButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-md border-primary/20">
              <DialogHeader>
                <DialogTitle className="m-0 p-0">
                  <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-xl md:text-2xl">
                    Upload Files
                  </span>
                </DialogTitle>
                <DialogClose className="absolute right-4 top-4">
                  <X className="h-4 w-4" />
                </DialogClose>
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
      </AnimatedSection>

      {/* Success message for file upload */}
      {showUploadSuccess && (
        <AnimatedSection direction="up" delay={0.1}>
          <motion.div
            className="bg-gradient-to-r from-green-500/10 to-primary/10 border border-green-500/30 rounded-xl p-5 flex items-center gap-4 animate-fadeIn shadow-lg backdrop-blur-sm"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedIcon
              icon={<CheckCircle className="h-6 w-6 text-green-500" />}
              className="p-2 bg-green-500/10 rounded-full"
              pulseEffect={true}
            />
            <div>
              <p className="font-medium text-green-500 text-lg">
                {newlyUploadedFiles.length === 1
                  ? '1 file uploaded successfully!'
                  : `${newlyUploadedFiles.length} files uploaded successfully!`}
              </p>
              <p className="text-sm text-muted-foreground">
                Your files are now available in the file manager.
              </p>
            </div>
          </motion.div>
        </AnimatedSection>
      )}

      <AnimatedSection direction="up" delay={0.2}>
        <div className="bg-card/30 backdrop-blur-sm p-1 rounded-xl border border-primary/10 shadow-lg">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-card/50 p-1">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                All Files
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                Images
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                Documents
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4 px-2 pb-2">
              {renderFileGrid(filteredFiles)}
            </TabsContent>
            <TabsContent value="images" className="mt-4 px-2 pb-2">
              {renderFileGrid(filteredFiles)}
            </TabsContent>
            <TabsContent value="documents" className="mt-4 px-2 pb-2">
              {renderFileGrid(filteredFiles)}
            </TabsContent>
          </Tabs>
        </div>
      </AnimatedSection>

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
      <Dialog
        open={!!previewFile}
        onOpenChange={(open) => {
          if (!open) {
            // Clean up blob URL to avoid memory leaks
            if (previewBlob) {
              URL.revokeObjectURL(previewBlob);
            }
            setPreviewFile(null);
            setPreviewUrl(null);
            setPreviewBlob(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl h-[85vh] max-h-[85vh] bg-card/90 backdrop-blur-md border-primary/20 shadow-xl">
          <DialogHeader className="border-b border-primary/10 pb-3">
            <div className="flex items-center gap-3">
              <AnimatedIcon
                icon={
                  previewFile?.type.startsWith('image/') ? (
                    <ImageIcon className="h-6 w-6 text-primary" />
                  ) : previewFile?.type === 'application/pdf' || previewFile?.name.toLowerCase().endsWith('.pdf') ? (
                    <FileText className="h-6 w-6 text-red-500" />
                  ) : previewFile?.type === 'text/plain' || previewFile?.name.toLowerCase().endsWith('.txt') ? (
                    <FileText className="h-6 w-6 text-primary" />
                  ) : previewFile?.name.toLowerCase().endsWith('.json') ? (
                    <FileJson className="h-6 w-6 text-yellow-500" />
                  ) : previewFile?.name.toLowerCase().endsWith('.md') || previewFile?.name.toLowerCase().endsWith('.csv') ? (
                    <FileCode className="h-6 w-6 text-green-500" />
                  ) : (
                    <FileText className="h-6 w-6 text-primary" />
                  )
                }
                className="p-2 bg-card/50 rounded-full"
              />
              <DialogTitle className="m-0 p-0">
                <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-xl md:text-2xl">
                  {previewFile?.name}
                </span>
              </DialogTitle>
            </div>
            <DialogClose className="absolute right-4 top-4 hover:bg-card/50 transition-colors duration-200">
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogHeader>
          <motion.div
            className="flex-1 overflow-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderFilePreview()}
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderFileGrid(files: FileMetadata[]) {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-card"></div>
            </div>
          </div>
          <span className="mt-4 text-muted-foreground font-medium">Loading your files...</span>
        </div>
      );
    }

    if (files.length === 0) {
      return (
        <div className="text-center py-16 bg-gradient-to-b from-card/50 to-card/30 backdrop-blur-sm rounded-xl border border-primary/10 shadow-lg">
          <div className="mb-3">
            <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-xl md:text-2xl">
              {searchQuery ? 'No files match your search' : 'Your file collection is empty'}
            </span>
          </div>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {searchQuery
              ? 'Try adjusting your search or upload new files.'
              : 'Upload your first file to get started. You can upload images, PDFs, and text files.'}
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <ProfessionalButton
              variant="primary"
              size="lg"
              icon={<Upload className="h-5 w-5" />}
              iconPosition="left"
              onClick={() => setUploadDialogOpen(true)}
              className="shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              Upload Your First File
            </ProfessionalButton>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {files.map((file, index) => {
          const isSelected = selectedFiles.some(f => f.id === file.id);
          const isImage = file.type.startsWith('image/');
          const isNewlyUploaded = newlyUploadedFiles.includes(file.id);

          // We'll use the ref callback to store references to newly uploaded files

          return (
            <motion.div
              ref={isNewlyUploaded ? (el) => { newFileRefs.current[file.id] = el; } : undefined}
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                ease: [0.25, 0.1, 0.25, 1.0]
              }}
              whileHover={{
                y: -5,
                boxShadow: isNewlyUploaded
                  ? '0 20px 25px -5px rgba(16, 185, 129, 0.15)'
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                scale: 1.02
              }}
              className={`relative overflow-hidden rounded-xl border ${
                isSelected ? 'border-primary' : isNewlyUploaded ? 'border-green-500' : 'border-primary/10'
              } bg-card/70 backdrop-blur-sm transition-all duration-300 ${
                isNewlyUploaded ? 'shadow-lg shadow-green-500/10 animate-fadeIn animate-highlight' : 'shadow-md'
              } ${
                selectable ? 'cursor-pointer' : ''
              }`}
              onClick={() => selectable && toggleFileSelection(file)}
            >
              {/* Selection indicator */}
              {selectable && (
                <div className={`absolute top-2 right-2 z-10 h-5 w-5 rounded-full border ${
                  isSelected ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'
                } flex items-center justify-center`}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
              )}

              {/* "New" badge for newly uploaded files */}
              {isNewlyUploaded && (
                <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  NEW
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
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="h-full w-full object-cover"
                      onError={async (e) => {
                        // If the public URL fails, try to get a signed URL
                        const signedUrl = await getSignedUrl(file.path, 300);
                        if (signedUrl && e.target instanceof HTMLImageElement) {
                          e.target.src = signedUrl;
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      {/* Show different icons based on file type */}
                      {file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? (
                        <FileText className="h-12 w-12 text-red-500/70" />
                      ) : file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt') ? (
                        <FileText className="h-12 w-12 text-primary/70" />
                      ) : file.name.toLowerCase().endsWith('.json') ? (
                        <FileJson className="h-12 w-12 text-yellow-500/70" />
                      ) : file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.csv') ? (
                        <FileCode className="h-12 w-12 text-green-500/70" />
                      ) : (
                        <FileText className="h-12 w-12 text-primary/70" />
                      )}
                      <span className="mt-2 text-xs text-muted-foreground uppercase">
                        {file.name.split('.').pop() || file.type.split('/')[1]}
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

                <div className="mt-4 flex justify-between">
                  <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary"
                      onClick={async (e) => {
                        e.stopPropagation();

                        // For images, try multiple approaches
                        if (file.type.startsWith('image/')) {
                          // First try to download the file directly and create a blob URL
                          const blob = await downloadFile(file.path);
                          if (blob) {
                            const url = URL.createObjectURL(blob);
                            setPreviewBlob(url);
                          } else {
                            // Fallback to signed URL
                            const signedUrl = await getSignedUrl(file.path, 300); // 5 minutes expiry
                            setPreviewUrl(signedUrl);
                          }
                        } else {
                          // For non-images, just use signed URL
                          const signedUrl = await getSignedUrl(file.path, 300); // 5 minutes expiry
                          setPreviewUrl(signedUrl);
                        }

                        setPreviewFile(file);
                      }}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-accent/5 hover:bg-accent/10 text-accent hover:text-accent"
                      onClick={async (e) => {
                        e.stopPropagation();
                        // Try to download the file directly
                        const blob = await downloadFile(file.path);
                        if (blob) {
                          // Create a download link
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = file.name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        } else {
                          // Fallback to signed URL
                          const signedUrl = await getSignedUrl(file.path, 60);
                          if (signedUrl) {
                            window.open(signedUrl, '_blank');
                          } else {
                            // Last resort: try public URL
                            window.open(file.public_url || '', '_blank');
                          }
                        }
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }
}

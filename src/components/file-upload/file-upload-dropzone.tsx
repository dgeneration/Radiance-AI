"use client";

import { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, X, AlertCircle, FileText, Image as ImageIcon, ArrowUpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ProfessionalButton } from '@/components/ui/professional-button';
import { motion } from 'framer-motion';
import { uploadFile, FileMetadata } from '@/utils/supabase/file-storage';
// import Image from 'next/image'; // Not used

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Allowed file types
const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
};

interface FileUploadDropzoneProps {
  userId: string;
  onUploadComplete: (files: FileMetadata[]) => void;
  multiple?: boolean;
}

export function FileUploadDropzone({ userId, onUploadComplete, multiple = true }: FileUploadDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    // Handle rejected files
    if (fileRejections.length > 0) {
      const errors = fileRejections.map(rejection => {
        if (rejection.file.size > MAX_FILE_SIZE) {
          return `${rejection.file.name} exceeds the maximum file size of 10MB`;
        }
        return `${rejection.file.name} is not an accepted file type`;
      });
      setError(errors.join(', '));
      return;
    }

    setError(null);

    if (multiple) {
      setFiles(prev => [...prev, ...acceptedFiles]);
    } else {
      setFiles(acceptedFiles);
    }
  }, [multiple]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      let uploadedFiles: FileMetadata[] = [];

      if (multiple) {
        // Simulate progress for multiple files
        const totalFiles = files.length;
        let completedFiles = 0;

        const updateProgress = () => {
          completedFiles++;
          setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
        };

        // Upload files one by one to track progress
        for (const file of files) {
          const result = await uploadFile(file, userId);
          if (result) {
            uploadedFiles.push(result);
          }
          updateProgress();
        }
      } else {
        // For single file upload
        setUploadProgress(50); // Start progress
        const result = await uploadFile(files[0], userId);
        if (result) {
          uploadedFiles = [result];
        }
        setUploadProgress(100); // Complete progress
      }

      onUploadComplete(uploadedFiles);
      setFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('An error occurred while uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6 text-primary" />;
    }
    return <FileText className="h-6 w-6 text-primary" />;
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const blobUrl = URL.createObjectURL(file);
      return (
        <div className="relative h-16 w-16 rounded-md overflow-hidden">
          <img
            src={blobUrl}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        </div>
      );
    }
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary/10">
        {getFileIcon(file)}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div {...getRootProps()}>
        <motion.div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
              : 'border-primary/20 hover:border-primary/40 bg-card/50 hover:shadow-md hover:bg-card/70'
          }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <motion.div
            className="p-4 bg-primary/10 rounded-full"
            animate={isDragActive ? {
              y: [0, -10, 0],
              scale: [1, 1.1, 1],
              transition: { repeat: Infinity, duration: 1.5 }
            } : {}}
          >
            <Upload className="h-10 w-10 text-primary" />
          </motion.div>
          <p className="text-xl font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or <span className="text-primary font-medium underline underline-offset-2 cursor-pointer">browse files</span>
          </p>
          <div className="mt-4 px-4 py-2 bg-card/70 backdrop-blur-sm rounded-lg border border-primary/10">
            <p className="text-xs text-muted-foreground">
              Accepted file types: JPG, PNG, GIF, PDF, TXT, DOC, DOCX (Max: 10MB)
            </p>
          </div>
        </div>
      </motion.div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Selected Files ({files.length})
            </div>
            {files.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-primary"
                onClick={() => setFiles([])}
                disabled={uploading}
              >
                Clear All
              </Button>
            )}
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 bg-card/70 backdrop-blur-sm border border-primary/10 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.01, borderColor: 'rgba(0, 198, 215, 0.3)' }}
              >
                <div className="flex items-center space-x-4">
                  {getFilePreview(file)}
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-primary/10 rounded-full text-xs text-primary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {uploading && (
            <div className="space-y-3 p-4 bg-card/70 backdrop-blur-sm border border-primary/10 rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary">
                  Uploading Files...
                </p>
                <p className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {uploadProgress}%
                </p>
              </div>
              <Progress
                value={uploadProgress}
                className="h-2 bg-primary/10"
              />
              <p className="text-xs text-muted-foreground text-center">
                Please wait while your files are being uploaded
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <ProfessionalButton
              variant="primary"
              size="lg"
              icon={uploading ? undefined : <ArrowUpCircle className="h-5 w-5" />}
              iconPosition="right"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                'Upload Files'
              )}
            </ProfessionalButton>
          </div>
        </div>
      )}
    </div>
  );
}

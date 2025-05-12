import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Define file metadata type
export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  path: string;
  user_id: string;
  public_url: string | null;
}

/**
 * Upload a file to Supabase storage
 * @param file The file to upload
 * @param userId The user ID to associate with the file
 * @returns The file metadata
 */
export async function uploadFile(file: File, userId: string): Promise<FileMetadata | null> {
  try {
    const supabase = createClient();

    // Generate a unique file name to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from('medical-reports')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    // Get the public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from('medical-reports')
      .getPublicUrl(filePath);

    // Create file metadata
    const metadata: FileMetadata = {
      id: uuidv4(),
      name: file.name,
      size: file.size,
      type: file.type,
      created_at: new Date().toISOString(),
      path: filePath,
      user_id: userId,
      public_url: publicUrlData.publicUrl
    };

    // Store the file metadata in the database
    const { error: dbError } = await supabase
      .from('file_metadata')
      .insert(metadata);

    if (dbError) {
      console.error('Error storing file metadata:', dbError);
      // Delete the uploaded file if metadata storage fails
      await supabase.storage
        .from('medical-reports')
        .remove([filePath]);
      return null;
    }

    return metadata;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return null;
  }
}

/**
 * Upload multiple files to Supabase storage
 * @param files The files to upload
 * @param userId The user ID to associate with the files
 * @returns Array of file metadata
 */
export async function uploadMultipleFiles(files: File[], userId: string): Promise<FileMetadata[]> {
  const results: FileMetadata[] = [];

  for (const file of files) {
    const result = await uploadFile(file, userId);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Get all files for a user
 * @param userId The user ID to get files for
 * @returns Array of file metadata
 */
export async function getUserFiles(userId: string): Promise<FileMetadata[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user files:', error);
      return [];
    }

    return data as FileMetadata[];
  } catch (error) {
    console.error('Error in getUserFiles:', error);
    return [];
  }
}

/**
 * Delete a file from Supabase storage
 * @param fileId The ID of the file metadata to delete
 * @param userId The user ID to verify ownership
 * @returns Whether the deletion was successful
 */
export async function deleteFile(fileId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    // Get the file metadata
    const { data, error } = await supabase
      .from('file_metadata')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error getting file metadata:', error);
      return false;
    }

    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from('medical-reports')
      .remove([data.path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      return false;
    }

    // Delete the file metadata from the database
    const { error: dbError } = await supabase
      .from('file_metadata')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId);

    if (dbError) {
      console.error('Error deleting file metadata:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFile:', error);
    return false;
  }
}

/**
 * Get a public URL for a file
 * @param filePath The path of the file in storage
 * @returns The public URL
 */
export function getPublicUrl(filePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage
    .from('medical-reports')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Get a signed URL for a file (works even if bucket is not public)
 * @param filePath The path of the file in storage
 * @param expiresIn Number of seconds until the signed URL expires (default: 60)
 * @returns The signed URL
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 60): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('medical-reports')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    return null;
  }
}

/**
 * Download a file directly
 * @param filePath The path of the file in storage
 * @returns The file data or null if there was an error
 */
export async function downloadFile(filePath: string): Promise<Blob | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('medical-reports')
      .download(filePath);

    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in downloadFile:', error);
    return null;
  }
}

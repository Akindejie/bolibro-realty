import { createClient } from '@supabase/supabase-js';

// Supabase bucket name
export const SUPABASE_BUCKETS = {
  PROPERTY_IMAGES: 'Property Images', // Match the exact name in your Supabase account
  DOCUMENTS: 'Lease Agreements and Documents',
};

// Create a Supabase client with the service key for full access
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!; // Using service key for server-side operations

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Don't persist session on server
  },
});

/**
 * Get the public URL for a file in Supabase storage
 */
export const getPublicFileUrl = (bucket: string, filePath: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};

/**
 * Upload a file to Supabase storage
 * @param bucket Bucket name
 * @param path File path within the bucket
 * @param file File buffer or blob
 * @param contentType MIME type of the file
 */
export const uploadToSupabase = async (
  bucket: string,
  path: string,
  file: Buffer | Blob,
  contentType?: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: contentType || 'application/octet-stream',
        upsert: false,
      });

    if (error) throw error;

    return getPublicFileUrl(bucket, path);
  } catch (error) {
    console.error(`Failed to upload file to ${bucket}/${path}:`, error);
    return null;
  }
};

/**
 * Delete a file from Supabase storage
 */
export const deleteFromSupabase = async (
  bucket: string,
  path: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${bucket}/${path}:`, error);
    return false;
  }
};

/**
 * Migrate files from legacy storage to Supabase
 * @param legacyUrl The original URL of the file
 * @param bucket The Supabase bucket to store the file in
 * @param newPath The new path for the file in Supabase storage
 */
export const migrateFileToSupabase = async (
  legacyUrl: string,
  bucket: string,
  newPath: string
): Promise<string | null> => {
  try {
    // Fetch the file content
    const response = await fetch(legacyUrl);
    if (!response.ok)
      throw new Error(`Failed to fetch file: ${response.statusText}`);

    // Get the file as a blob
    const fileBlob = await response.blob();

    // Upload to Supabase
    return await uploadToSupabase(
      bucket,
      newPath,
      fileBlob,
      fileBlob.type || 'image/jpeg'
    );
  } catch (error) {
    console.error(`Failed to migrate file ${legacyUrl}:`, error);
    return null;
  }
};

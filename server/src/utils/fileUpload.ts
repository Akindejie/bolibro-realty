import { supabase, SUPABASE_BUCKETS } from '../config/supabase';

/**
 * Upload a file to Supabase storage
 * Note: AWS S3 has been fully migrated to Supabase storage as of June 2025
 *
 * @param file The file to upload
 * @param folder The folder to upload to (e.g., 'properties', 'documents')
 * @returns The public URL of the uploaded file
 */
export const uploadFile = async (
  file: any,
  folder: string
): Promise<string | null> => {
  try {
    if (!file) return null;

    // Determine the bucket based on folder
    const bucket =
      folder === 'properties'
        ? SUPABASE_BUCKETS.PROPERTY_IMAGES
        : SUPABASE_BUCKETS.DOCUMENTS;

    // Create a unique filename
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.data, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('File upload error:', error);
    return null;
  }
};

/**
 * Delete a file from Supabase storage
 *
 * @param fileUrl The public URL of the file to delete
 * @returns Boolean indicating success or failure
 */
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  try {
    // Extract the bucket and path from the URL
    // URL format: https://{supabase-project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('public') + 1;

    if (bucketIndex < 0 || bucketIndex >= pathParts.length) {
      console.error('Invalid Supabase URL format:', fileUrl);
      return false;
    }

    const bucket = pathParts[bucketIndex];
    const path = pathParts.slice(bucketIndex + 1).join('/');

    // Delete from Supabase
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('File delete error:', error);
    return false;
  }
};

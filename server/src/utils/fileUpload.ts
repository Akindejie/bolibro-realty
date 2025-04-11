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

/**
 * Upload a lease document to Supabase storage
 *
 * @param file The file to upload (from multer)
 * @param leaseId The ID of the lease associated with this document
 * @param documentType The type of document (e.g., 'agreement', 'addendum')
 * @returns The public URL of the uploaded document
 */
export const uploadLeaseDocument = async (
  file: Express.Multer.File,
  leaseId: number,
  documentType: string
): Promise<string | null> => {
  try {
    if (!file) return null;

    // Create a folder structure based on lease ID and document type
    const folder = `lease-${leaseId}/${documentType}`;

    // Create a unique filename
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = `${folder}/${fileName}`;

    // Define fallback bucket names to try
    const bucketNamesToTry = [
      SUPABASE_BUCKETS.DOCUMENTS,
      'lease-agreements-and-documents',
      'Lease Agreements and Documents',
    ];

    // Try uploading to each bucket until successful
    let documentUrl = null;

    for (const bucketName of bucketNamesToTry) {
      try {
        console.log(`Attempting upload to bucket: "${bucketName}"`);

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          console.log(`Upload to "${bucketName}" failed:`, error.message);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        documentUrl = urlData.publicUrl;
        console.log(`Successfully uploaded to bucket "${bucketName}"`);
        break;
      } catch (err) {
        console.error(`Error trying bucket "${bucketName}":`, err);
      }
    }

    if (!documentUrl) {
      console.error('Failed to upload document to any bucket');
      return null;
    }

    return documentUrl;
  } catch (error) {
    console.error('Lease document upload error:', error);
    return null;
  }
};

/**
 * Upload a property image with organized folder structure
 *
 * @param file The file to upload (from multer)
 * @param propertyId The ID of the property
 * @returns The public URL of the uploaded image
 */
export const uploadPropertyImageToFolder = async (
  file: Express.Multer.File,
  propertyId: string | number
): Promise<string | null> => {
  try {
    if (!file) return null;

    // Create a folder structure based on property ID
    const folder = `property-${propertyId}`;

    // Create a unique filename
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = `${folder}/${fileName}`;

    // Define fallback bucket names to try
    const bucketNamesToTry = [
      SUPABASE_BUCKETS.PROPERTY_IMAGES,
      'property-images',
    ];

    // Try uploading to each bucket until successful
    let imageUrl = null;

    for (const bucketName of bucketNamesToTry) {
      try {
        console.log(
          `Attempting upload to bucket: "${bucketName}" in folder: "${folder}"`
        );

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          console.log(`Upload to "${bucketName}" failed:`, error.message);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
        console.log(
          `Successfully uploaded to bucket "${bucketName}" at path "${filePath}"`
        );
        break;
      } catch (err) {
        console.error(`Error trying bucket "${bucketName}":`, err);
      }
    }

    if (!imageUrl) {
      console.error('Failed to upload image to any bucket');
      return null;
    }

    return imageUrl;
  } catch (error) {
    console.error('Property image upload error:', error);
    return null;
  }
};

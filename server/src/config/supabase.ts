import { createClient } from '@supabase/supabase-js';

// Supabase bucket name - use exact match for API operations
export const SUPABASE_BUCKETS = {
  PROPERTY_IMAGES: 'property-images',
  DOCUMENTS: 'lease-agreements-and-documents',
};

// Bucket IDs for direct reference if needed
export const SUPABASE_BUCKET_IDS = {
  PROPERTY_IMAGES: 'fe1432c2-6571-4fe5-b628-000a37aa7868',
};

// For display/UI purposes only - the actual bucket names in Supabase dashboard
// export const SUPABASE_DISPLAY_BUCKETS = {
//   PROPERTY_IMAGES: 'Property Images',
//   DOCUMENTS: 'Lease Agreements and Documents',
// };

// Create a Supabase client with the service key for full access
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!; // Using service key for server-side operations

// Debug Supabase configuration
console.log('Supabase configuration:');
console.log('- URL defined:', !!supabaseUrl);
console.log('- URL value:', supabaseUrl?.substring(0, 10) + '...');
console.log('- Service key defined:', !!supabaseKey);
console.log('- Service key length:', supabaseKey?.length || 0);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Don't persist session on server
  },
});

/**
 * Create buckets if they don't exist
 */
export const ensureBucketsExist = async (): Promise<void> => {
  try {
    console.log('Checking if required Supabase buckets exist...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error listing buckets:', error.message);
      return;
    }

    console.log('Available buckets:', buckets.map((b) => b.name).join(', '));

    // Check if the required buckets exist
    const propertyImagesBucketExists = buckets.some(
      (b) => b.name === SUPABASE_BUCKETS.PROPERTY_IMAGES
    );
    const documentsBucketExists = buckets.some(
      (b) => b.name === SUPABASE_BUCKETS.DOCUMENTS
    );

    // Check property images bucket
    if (!propertyImagesBucketExists) {
      console.log(`Creating bucket '${SUPABASE_BUCKETS.PROPERTY_IMAGES}'...`);
      try {
        const { error: createError } = await supabase.storage.createBucket(
          SUPABASE_BUCKETS.PROPERTY_IMAGES,
          {
            public: true,
            allowedMimeTypes: ['image/*', 'application/pdf'],
            fileSizeLimit: 10485760, // 10MB
          }
        );

        if (createError) {
          console.error(
            `Failed to create bucket '${SUPABASE_BUCKETS.PROPERTY_IMAGES}':`,
            createError.message
          );
        } else {
          console.log(
            `Successfully created bucket '${SUPABASE_BUCKETS.PROPERTY_IMAGES}'`
          );
        }
      } catch (err) {
        console.error(
          `Error creating bucket ${SUPABASE_BUCKETS.PROPERTY_IMAGES}:`,
          err
        );
      }
    } else {
      console.log(
        `Bucket '${SUPABASE_BUCKETS.PROPERTY_IMAGES}' already exists`
      );
    }

    // Check documents bucket
    if (!documentsBucketExists) {
      console.log(`Creating bucket '${SUPABASE_BUCKETS.DOCUMENTS}'...`);
      try {
        const { error: createError } = await supabase.storage.createBucket(
          SUPABASE_BUCKETS.DOCUMENTS,
          {
            public: true,
            allowedMimeTypes: ['image/*', 'application/pdf'],
            fileSizeLimit: 10485760, // 10MB
          }
        );

        if (createError) {
          console.error(
            `Failed to create bucket '${SUPABASE_BUCKETS.DOCUMENTS}':`,
            createError.message
          );
        } else {
          console.log(
            `Successfully created bucket '${SUPABASE_BUCKETS.DOCUMENTS}'`
          );
        }
      } catch (err) {
        console.error(
          `Error creating bucket ${SUPABASE_BUCKETS.DOCUMENTS}:`,
          err
        );
      }
    } else {
      console.log(`Bucket '${SUPABASE_BUCKETS.DOCUMENTS}' already exists`);
    }

    // Check final bucket configuration
    console.log('Final bucket names for API operations:');
    console.log(`- Property Images: ${SUPABASE_BUCKETS.PROPERTY_IMAGES}`);
    console.log(`- Documents: ${SUPABASE_BUCKETS.DOCUMENTS}`);
  } catch (err: any) {
    console.error('Error ensuring buckets exist:', err.message);
  }
};

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

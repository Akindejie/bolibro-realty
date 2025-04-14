import { supabase } from '../config/supabase';

/**
 * Creates and verifies necessary Supabase storage buckets exist
 * @returns Promise that resolves when all buckets have been checked/created
 */
export async function ensureBucketsExist(): Promise<void> {
  try {
    console.log('Verifying Supabase storage buckets...');

    // List existing buckets
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();
    if (listError) {
      throw new Error(`Error listing buckets: ${listError.message}`);
    }

    console.log(
      'Existing buckets:',
      buckets?.map((b) => b.name).join(', ') || 'none'
    );

    // Create or update property images bucket
    await ensureBucketExists(buckets || [], 'property-images', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 10485760, // 10MB
    });

    // Create or update documents bucket
    await ensureBucketExists(buckets || [], 'lease-agreements-and-documents', {
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'image/*',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      fileSizeLimit: 20971520, // 20MB
    });

    console.log('✅ All Supabase buckets verified successfully');
  } catch (error) {
    console.error('❌ Error verifying Supabase buckets:', error);
    throw error;
  }
}

/**
 * Ensures a specific bucket exists with the right configuration
 */
async function ensureBucketExists(
  existingBuckets: Array<{ name: string }>,
  bucketName: string,
  options: {
    public: boolean;
    allowedMimeTypes?: string[];
    fileSizeLimit?: number;
  }
): Promise<void> {
  const bucketExists = existingBuckets.some((b) => b.name === bucketName);

  if (!bucketExists) {
    console.log(`Creating "${bucketName}" bucket...`);
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: options.public,
      allowedMimeTypes: options.allowedMimeTypes,
      fileSizeLimit: options.fileSizeLimit,
    });

    if (error) {
      if (error.message.includes('The resource already exists')) {
        console.log(
          `Bucket "${bucketName}" already exists (created in another process)`
        );
      } else {
        console.error(`Error creating bucket "${bucketName}":`, error);
        throw error;
      }
    } else {
      console.log(`Successfully created "${bucketName}" bucket`);
    }
  } else {
    console.log(`Bucket "${bucketName}" already exists`);
  }

  // Ensure bucket has correct settings
  try {
    // updateBucket is not available in the current version
    // Instead, create a dummy file to update permissions or log a message
    console.log(
      `Note: Cannot update bucket "${bucketName}" settings automatically with current Supabase JS version`
    );
    console.log(
      `Please manually configure bucket "${bucketName}" settings in the Supabase dashboard:`
    );
    console.log(`- Public: ${options.public}`);
    console.log(
      `- Allowed MIME types: ${options.allowedMimeTypes?.join(', ')}`
    );
    console.log(`- File size limit: ${options.fileSizeLimit} bytes`);

    // Create a simple metadata file to mark configuration
    const metadataContent = Buffer.from(
      JSON.stringify({
        configured: true,
        timestamp: new Date().toISOString(),
        settings: options,
      })
    );

    const { error: metadataError } = await supabase.storage
      .from(bucketName)
      .upload('.bucket-config.json', metadataContent, {
        contentType: 'application/json',
        upsert: true,
      });

    if (metadataError) {
      console.log(
        `Note: Could not write config metadata: ${metadataError.message}`
      );
    }
  } catch (error) {
    console.error(`Error with bucket "${bucketName}" settings:`, error);
  }
}

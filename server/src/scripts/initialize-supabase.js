/**
 * Script to initialize the Supabase environment
 * - Creates the necessary storage buckets
 * - Cleans any existing files
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureBucketExists(bucketName, options = {}) {
  console.log(`Checking for bucket: ${bucketName}`);

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucket = buckets.find((b) => b.name === bucketName);

    if (bucket) {
      console.log(`Bucket "${bucketName}" already exists`);
      return true;
    }

    // Create bucket if it doesn't exist
    console.log(`Creating bucket: ${bucketName}`);
    const { error: createError } = await supabase.storage.createBucket(
      bucketName,
      options
    );

    if (createError) {
      console.error(`Error creating bucket "${bucketName}":`, createError);
      return false;
    }

    console.log(`Successfully created bucket "${bucketName}"`);
    return true;
  } catch (error) {
    console.error(`Unexpected error with bucket "${bucketName}":`, error);
    return false;
  }
}

async function cleanBucket(bucketName) {
  console.log(`Cleaning bucket: ${bucketName}`);

  try {
    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list();

    if (listError) {
      console.error(`Error listing files in bucket ${bucketName}:`, listError);
      return false;
    }

    if (!files || files.length === 0) {
      console.log(`No files found in bucket ${bucketName}`);
      return true;
    }

    console.log(`Found ${files.length} files in bucket ${bucketName}`);

    // Extract file paths
    const filePaths = files.map((file) => file.name);

    // Delete all files
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filePaths);

    if (deleteError) {
      console.error(
        `Error deleting files from bucket ${bucketName}:`,
        deleteError
      );
      return false;
    }

    console.log(`Successfully cleaned bucket ${bucketName}`);
    return true;
  } catch (error) {
    console.error(`Unexpected error cleaning bucket ${bucketName}:`, error);
    return false;
  }
}

async function initializeStorage() {
  console.log('Initializing Supabase storage...');

  // Define the required buckets with their options
  const requiredBuckets = [
    {
      name: 'property-images',
      options: {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      },
    },
    {
      name: 'lease-agreements-and-documents',
      options: {
        public: false, // Private bucket
        fileSizeLimit: 15 * 1024 * 1024, // 15MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
        ],
      },
    },
  ];

  // Ensure all required buckets exist
  for (const bucket of requiredBuckets) {
    const success = await ensureBucketExists(bucket.name, bucket.options);
    if (success) {
      // Clean the bucket if it exists or was created
      await cleanBucket(bucket.name);
    }
  }

  console.log('Storage initialization completed');
}

// Run the initialization
initializeStorage()
  .then(() => {
    console.log('Initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Initialization failed:', error);
    process.exit(1);
  });

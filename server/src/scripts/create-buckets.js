// Import the Supabase client and config directly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase bucket names - copied from config to avoid import issues
const SUPABASE_BUCKETS = {
  PROPERTY_IMAGES: 'property-images',
  DOCUMENTS: 'lease-agreements-and-documents',
};

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define the required buckets with their options
const requiredBuckets = [
  {
    name: SUPABASE_BUCKETS.PROPERTY_IMAGES,
    options: {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
  },
  {
    name: SUPABASE_BUCKETS.DOCUMENTS,
    options: {
      public: true, // Changed to public for easier access
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

async function ensureBucketsExist() {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error(
        'Missing Supabase credentials. Make sure environment variables are set.'
      );
      return;
    }

    console.log('Checking Supabase buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error listing buckets:', error.message);
      return;
    }

    console.log(
      'Existing buckets:',
      buckets.map((b) => `"${b.name}"`).join(', ')
    );

    // Ensure each required bucket exists
    for (const bucket of requiredBuckets) {
      const bucketExists = buckets.some((b) => b.name === bucket.name);

      if (!bucketExists) {
        console.log(`Creating bucket "${bucket.name}"...`);
        try {
          const { error: createError } = await supabase.storage.createBucket(
            bucket.name,
            bucket.options
          );

          if (createError) {
            console.error(
              `Failed to create bucket "${bucket.name}":`,
              createError.message
            );
          } else {
            console.log(`Successfully created bucket "${bucket.name}"`);
          }
        } catch (err) {
          console.error(`Error creating bucket "${bucket.name}":`, err);
        }
      } else {
        console.log(`Bucket "${bucket.name}" already exists`);
      }
    }

    console.log('Bucket setup complete');
  } catch (err) {
    console.error('Error in bucket setup:', err);
  }
}

// Run the setup
ensureBucketsExist();

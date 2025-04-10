// Script to create required Supabase buckets
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define required buckets
const REQUIRED_BUCKETS = [
  {
    name: 'property-images',
    options: {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 10485760, // 10MB
    },
  },
  {
    name: 'lease-agreements-and-documents',
    options: {
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'image/*',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      fileSizeLimit: 15728640, // 15MB
    },
  },
];

async function ensureBucketsExist() {
  console.log('Checking Supabase buckets...');

  try {
    // List existing buckets
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();

    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return;
    }

    console.log('Existing buckets:', buckets.map((b) => b.name).join(', '));

    // Check and create each required bucket
    for (const requiredBucket of REQUIRED_BUCKETS) {
      const exists = buckets.some((b) => b.name === requiredBucket.name);

      if (exists) {
        console.log(`Bucket "${requiredBucket.name}" already exists`);
      } else {
        console.log(`Creating bucket "${requiredBucket.name}"...`);

        try {
          const { data, error } = await supabase.storage.createBucket(
            requiredBucket.name,
            requiredBucket.options
          );

          if (error) {
            console.error(
              `Error creating bucket "${requiredBucket.name}":`,
              error
            );
          } else {
            console.log(`Successfully created bucket "${requiredBucket.name}"`);
          }
        } catch (createError) {
          console.error(
            `Error creating bucket "${requiredBucket.name}":`,
            createError
          );
        }
      }
    }

    console.log('Bucket setup complete');
  } catch (error) {
    console.error('Error setting up buckets:', error);
  }
}

ensureBucketsExist();

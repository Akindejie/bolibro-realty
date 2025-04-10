require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_BUCKETS = {
  PROPERTY_IMAGES: 'Property Images', // Match the exact name in your Supabase account
  DOCUMENTS: 'Lease Agreements and Documents',
};

async function createBuckets() {
  console.log('Checking and creating required Supabase buckets...');

  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Error: Missing required Supabase environment variables');
    process.exit(1);
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // List existing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      process.exit(1);
    }

    console.log(`Found ${buckets.length} existing buckets`);

    // Check for required buckets
    const propertyImagesBucket = buckets.find(
      (b) => b.name === SUPABASE_BUCKETS.PROPERTY_IMAGES
    );
    const documentsBucket = buckets.find(
      (b) => b.name === SUPABASE_BUCKETS.DOCUMENTS
    );

    // Create missing buckets
    const bucketsToCreate = [];

    if (!propertyImagesBucket) {
      console.log(`Creating bucket: ${SUPABASE_BUCKETS.PROPERTY_IMAGES}`);
      bucketsToCreate.push(
        createBucket(supabase, SUPABASE_BUCKETS.PROPERTY_IMAGES, true)
      );
    } else {
      console.log(`Bucket already exists: ${SUPABASE_BUCKETS.PROPERTY_IMAGES}`);
    }

    if (!documentsBucket) {
      console.log(`Creating bucket: ${SUPABASE_BUCKETS.DOCUMENTS}`);
      bucketsToCreate.push(
        createBucket(supabase, SUPABASE_BUCKETS.DOCUMENTS, true)
      );
    } else {
      console.log(`Bucket already exists: ${SUPABASE_BUCKETS.DOCUMENTS}`);
    }

    if (bucketsToCreate.length > 0) {
      await Promise.all(bucketsToCreate);
      console.log('All required buckets created successfully');
    } else {
      console.log('All required buckets already exist');
    }

    // List buckets again to verify
    const { data: updatedBuckets } = await supabase.storage.listBuckets();
    console.log('\nUpdated buckets list:');
    updatedBuckets.forEach((bucket) => {
      console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
  } catch (error) {
    console.error('Error creating buckets:', error);
    process.exit(1);
  }
}

async function createBucket(supabase, name, isPublic = false) {
  try {
    const { data, error } = await supabase.storage.createBucket(name, {
      public: isPublic,
    });

    if (error) {
      console.error(`Error creating bucket ${name}:`, error.message);
      return false;
    }

    console.log(`Successfully created bucket: ${name}`);
    return true;
  } catch (error) {
    console.error(`Error creating bucket ${name}:`, error);
    return false;
  }
}

createBuckets();

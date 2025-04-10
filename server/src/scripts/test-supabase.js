require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_BUCKETS = {
  PROPERTY_IMAGES: 'Property Images', // Match the exact name in your Supabase account
  DOCUMENTS: 'Lease Agreements and Documents',
};

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');

  // Check environment variables
  console.log(
    `SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing'}`
  );
  console.log(
    `SUPABASE_ANON_KEY: ${
      process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'
    }`
  );
  console.log(
    `SUPABASE_SERVICE_KEY: ${
      process.env.SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Missing'
    }`
  );

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Error: Missing required Supabase environment variables');
    return;
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

    // Test connectivity by listing buckets
    console.log('\nListing storage buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      return;
    }

    console.log('✓ Successfully connected to Supabase');
    console.log(`Found ${buckets.length} buckets:`);

    // Check for required buckets
    const propertyImagesBucket = buckets.find(
      (b) => b.name === SUPABASE_BUCKETS.PROPERTY_IMAGES
    );
    const documentsBucket = buckets.find(
      (b) => b.name === SUPABASE_BUCKETS.DOCUMENTS
    );

    console.log('\nBuckets:');
    buckets.forEach((bucket) => {
      console.log(`- ${bucket.name} (${bucket.id})`);
    });

    console.log('\nRequired buckets:');
    console.log(
      `- ${SUPABASE_BUCKETS.PROPERTY_IMAGES}: ${
        propertyImagesBucket ? '✓ Found' : '✗ Missing'
      }`
    );
    console.log(
      `- ${SUPABASE_BUCKETS.DOCUMENTS}: ${
        documentsBucket ? '✓ Found' : '✗ Missing'
      }`
    );

    // If any required bucket is missing, show instructions to create it
    if (!propertyImagesBucket || !documentsBucket) {
      console.log(
        '\nMissing required buckets. Create them in the Supabase dashboard:'
      );
      console.log('1. Go to Storage in your Supabase dashboard');
      console.log('2. Click "New Bucket"');
      console.log('3. Enter the exact bucket name (case sensitive)');
      console.log('4. Set public access as needed');
    } else {
      console.log('\n✓ All required buckets exist');
    }

    // Test a small operation on each bucket
    if (propertyImagesBucket) {
      console.log('\nTesting access to Property Images bucket...');
      const { data: files, error: listError } = await supabase.storage
        .from(SUPABASE_BUCKETS.PROPERTY_IMAGES)
        .list();

      if (listError) {
        console.error(
          `Error listing files in ${SUPABASE_BUCKETS.PROPERTY_IMAGES}:`,
          listError.message
        );
      } else {
        console.log(
          `✓ Successfully accessed ${SUPABASE_BUCKETS.PROPERTY_IMAGES} bucket`
        );
        console.log(`  Found ${files.length} files/folders`);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSupabaseConnection()
  .then(() => console.log('\nTest completed'))
  .catch((err) => console.error('Test failed:', err));

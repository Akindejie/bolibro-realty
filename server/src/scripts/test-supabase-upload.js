// Script to test Supabase upload directly
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

// Define bucket names - must match EXACTLY what exists in Supabase
const BUCKET_NAME = 'Property Images';
const BUCKET_ALTERNATIVES = [
  'Property Images',
  'Property Images ', // with trailing space
  ' Property Images', // with leading space
  'property-images', // hyphenated
  'property_images', // with underscore
  'PropertyImages', // camel case
];

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  console.log(`Using URL: ${supabaseUrl}`);

  try {
    // List buckets to check connection
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();

    if (bucketError) {
      console.error('Error connecting to Supabase:', bucketError);
      return;
    }

    console.log('Successfully connected to Supabase');
    console.log('Available buckets:', buckets.map((b) => b.name).join(', '));

    // Check for target bucket
    const ourBucket = buckets.find((b) => b.name === BUCKET_NAME);

    if (!ourBucket) {
      console.error(`Bucket "${BUCKET_NAME}" not found!`);
      console.log('Available buckets:', buckets.map((b) => b.name).join(', '));

      // Create the bucket if it doesn't exist
      console.log(`Attempting to create bucket "${BUCKET_NAME}"...`);
      const { error: createError } = await supabase.storage.createBucket(
        BUCKET_NAME,
        {
          public: false,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 10485760, // 10MB
        }
      );

      if (createError) {
        console.error('Failed to create bucket:', createError);
      } else {
        console.log(`Successfully created bucket "${BUCKET_NAME}"`);
      }
    } else {
      console.log(`Bucket "${BUCKET_NAME}" found and ready for uploads`);
    }

    // Check all alternative bucket names
    console.log('\nTesting alternative bucket name formats:');
    for (const bucketName of BUCKET_ALTERNATIVES) {
      const found = buckets.find((b) => b.name === bucketName);
      console.log(
        `- "${bucketName}" (${bucketName.length} chars): ${
          found ? 'FOUND' : 'NOT FOUND'
        }`
      );

      // Show characters as hex codes to detect invisible characters
      console.log(
        '  Character codes:',
        [...bucketName].map((c) => c.charCodeAt(0).toString(16)).join(' ')
      );
    }

    // Try to get bucket details directly
    try {
      console.log('\nTrying to access bucket details directly:');
      const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);

      if (error) {
        console.error(
          `Error getting bucket details for "${BUCKET_NAME}":`,
          error
        );
      } else {
        console.log(
          `Successfully retrieved bucket details for "${BUCKET_NAME}":`,
          data
        );
      }
    } catch (error) {
      console.error('Error accessing bucket details:', error);
    }
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
  }
}

async function testUploadToSupabase() {
  try {
    // Create a test file in memory
    const testFilePath = path.join(__dirname, 'test-image.txt');
    const testContent =
      'This is a test file content to simulate an image upload.';

    // Write test file
    fs.writeFileSync(testFilePath, testContent);

    // Read file buffer
    const fileBuffer = fs.readFileSync(testFilePath);

    // Try uploads with different bucket names
    for (const bucketName of BUCKET_ALTERNATIVES) {
      console.log(`\nTrying upload to bucket: "${bucketName}"`);

      try {
        // Upload file to Supabase
        const fileName = `test-upload-${Date.now()}.txt`;
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, fileBuffer, {
            contentType: 'text/plain',
            upsert: true,
          });

        if (error) {
          console.error(`Error uploading to "${bucketName}":`, error);
        } else {
          console.log(`Upload successful to "${bucketName}"!`);
          console.log('Upload data:', data);

          // Get public URL
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

          console.log('Public URL:', urlData.publicUrl);
        }
      } catch (error) {
        console.error(`Error in upload test for "${bucketName}":`, error);
      }
    }

    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('\nTest file cleaned up');
  } catch (error) {
    console.error('Error in upload test:', error);
  }
}

async function runTests() {
  await testSupabaseConnection();
  console.log('\n---------------------------------------\n');
  await testUploadToSupabase();
}

runTests();

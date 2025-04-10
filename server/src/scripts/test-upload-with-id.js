// Test upload to property-images bucket using ID reference
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Import config - get the Supabase URL and key directly from env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Define the bucket name and ID
const BUCKET_NAME = 'property-images';
const BUCKET_ID = 'fe1432c2-6571-4fe5-b628-000a37aa7868';

// Create a test file
const testFilePath = path.join(__dirname, 'test-upload.txt');
fs.writeFileSync(
  testFilePath,
  'Test file content - ' + new Date().toISOString()
);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

async function testUpload() {
  console.log('Testing upload to property-images bucket...');
  console.log('Bucket name:', BUCKET_NAME);
  console.log('Bucket ID:', BUCKET_ID);

  try {
    // Read test file
    const fileContent = fs.readFileSync(testFilePath);

    // Upload using bucket name
    console.log('\nUploading using bucket name...');
    const fileName = `test-name-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileContent, {
        contentType: 'text/plain',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
    } else {
      console.log('Upload successful!');

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log('File URL:', urlData.publicUrl);
    }

    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('\nTest file removed');

    return uploadError ? false : true;
  } catch (err) {
    console.error('Error during test:', err);
    return false;
  }
}

testUpload()
  .then((success) => {
    console.log(`\nTest ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

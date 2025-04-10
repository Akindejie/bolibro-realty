// Script to test uploading an image to Supabase property-images bucket
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Create a test image file if it doesn't exist
const createTestImage = () => {
  const testDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const imagePath = path.join(testDir, 'test-image.txt');
  fs.writeFileSync(imagePath, 'This is a test file for upload');

  return imagePath;
};

const testUpload = async () => {
  console.log('Testing image upload to Supabase...');

  // Create Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Check your .env file.');
    return;
  }

  console.log('Supabase credentials found.');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  try {
    // Create a test image file
    const imagePath = createTestImage();
    console.log(`Created test file at: ${imagePath}`);

    // Read the file
    const fileBuffer = fs.readFileSync(imagePath);
    console.log(`File size: ${fileBuffer.length} bytes`);

    // Upload to Supabase
    const fileName = `test-upload-${Date.now()}.txt`;
    const bucket = 'property-images';

    console.log(
      `Uploading to bucket "${bucket}" with filename "${fileName}"...`
    );

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (error) {
      console.error('Upload failed:', error);
      return;
    }

    console.log('Upload successful!');
    console.log('Upload data:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log('Public URL:', urlData.publicUrl);

    // Clean up
    fs.unlinkSync(imagePath);
    console.log('Test file removed');

    return urlData.publicUrl;
  } catch (err) {
    console.error('Error during test:', err);
  }
};

testUpload()
  .then((url) => {
    if (url) {
      console.log('\nTest completed successfully!');
      console.log('The uploaded file is available at:', url);
    } else {
      console.log('\nTest failed.');
    }
  })
  .catch((err) => {
    console.error('Fatal error:', err);
  });

// Debug script for image uploads
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Target property ID
const PROPERTY_ID = 22; // Property 3 in UI
const API_URL = 'http://localhost:3001';

// Need a manager auth token - normally from login, this is hardcoded for testing
const MANAGER_TOKEN = process.env.DEBUG_MANAGER_TOKEN || 'YOUR_AUTH_TOKEN';

// Create a test image file
const createTestImage = () => {
  // Create a simple text file as a test placeholder
  const testDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const imagePath = path.join(testDir, 'test-image-1.jpg');

  // Just write a dummy text file for testing - in a real app this would be a proper image
  fs.writeFileSync(
    imagePath,
    'This is a test image content - ' + new Date().toISOString()
  );

  return imagePath;
};

const testImageUpload = async () => {
  try {
    console.log(`Testing image upload to property ${PROPERTY_ID}...`);

    // Create a test image
    const imagePath = createTestImage();
    console.log(`Created test image at: ${imagePath}`);

    // Create form data
    const formData = new FormData();
    formData.append('images', fs.createReadStream(imagePath), {
      filename: 'test-image-1.jpg',
      contentType: 'image/jpeg',
    });

    console.log('Sending request to upload image...');

    // Get Supabase bucket info for logging
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    );

    // Check bucket configuration
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log(
      'Available Supabase buckets:',
      buckets.map((b) => b.name).join(', ')
    );

    // Debug Supabase configuration from our app code
    const { SUPABASE_BUCKETS } = require('../config/supabase');
    console.log(
      'App is configured to use bucket:',
      SUPABASE_BUCKETS.PROPERTY_IMAGES
    );

    // Debug our bucket contents
    const { data: files } = await supabase.storage
      .from(SUPABASE_BUCKETS.PROPERTY_IMAGES)
      .list();
    console.log(
      `Current files in ${SUPABASE_BUCKETS.PROPERTY_IMAGES}:`,
      files && files.length ? files.map((f) => f.name).join(', ') : 'No files'
    );

    // Send the upload request
    try {
      const response = await axios.post(
        `${API_URL}/properties/${PROPERTY_ID}/images`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${MANAGER_TOKEN}`,
          },
        }
      );

      console.log('Upload response:', response.data);

      // Verify after upload
      const { data: updatedFiles } = await supabase.storage
        .from(SUPABASE_BUCKETS.PROPERTY_IMAGES)
        .list();
      console.log(
        `Files in ${SUPABASE_BUCKETS.PROPERTY_IMAGES} after upload:`,
        updatedFiles && updatedFiles.length
          ? updatedFiles.map((f) => f.name).join(', ')
          : 'No files'
      );

      // Also check property data
      const propertyResponse = await axios.get(
        `${API_URL}/properties/${PROPERTY_ID}`
      );

      console.log('Property data after upload:');
      console.log('- Images:', propertyResponse.data.images.length || 0);
      console.log('- PhotoUrls:', propertyResponse.data.photoUrls.length || 0);

      return true;
    } catch (uploadError) {
      console.error('Upload request failed:', uploadError.message);
      if (uploadError.response) {
        console.error('Response status:', uploadError.response.status);
        console.error('Response data:', uploadError.response.data);
      }
      return false;
    } finally {
      // Clean up
      fs.unlinkSync(imagePath);
      console.log('Test image removed');
    }
  } catch (err) {
    console.error('Error during test:', err);
    return false;
  }
};

testImageUpload()
  .then((success) => {
    console.log(`\nTest ${success ? 'COMPLETED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

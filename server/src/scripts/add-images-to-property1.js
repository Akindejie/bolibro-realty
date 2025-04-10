// Script to add images to Property 1
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const PROPERTY_NAME = 'Property 1'; // Will look up ID
const BUCKET_NAME = 'property-images';

// Sample tiny PNG images (1x1 pixel in base64)
const sampleImages = [
  {
    name: 'property1-front.png',
    data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // red
    type: 'image/png',
  },
  {
    name: 'property1-interior.png',
    data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+G+qBwAEGAGQFMqCBgAAAABJRU5ErkJggg==', // yellow
    type: 'image/png',
  },
];

// Set up clients
const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

// Create temporary image files from base64 data
const createImageFiles = () => {
  const testDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  return sampleImages.map((img) => {
    const imagePath = path.join(testDir, img.name);
    const buffer = Buffer.from(img.data, 'base64');
    fs.writeFileSync(imagePath, buffer);

    return {
      path: imagePath,
      buffer,
      name: img.name,
      type: img.type,
    };
  });
};

const addImagesToProperty = async () => {
  try {
    console.log(`Finding property with name: ${PROPERTY_NAME}...`);

    // Check if property exists by name
    const property = await prisma.property.findFirst({
      where: { name: PROPERTY_NAME },
      select: {
        id: true,
        name: true,
        images: true,
        photoUrls: true,
      },
    });

    if (!property) {
      console.error(`Property with name "${PROPERTY_NAME}" not found`);
      return false;
    }

    const propertyId = property.id;

    console.log(`Found property: ${property.name} (ID: ${property.id})`);
    console.log(`Current images: ${property.images?.length || 0}`);
    console.log(`Current photoUrls: ${property.photoUrls?.length || 0}`);

    // Log bucket info
    console.log(`Using bucket: ${BUCKET_NAME}`);

    // Create and upload real image files
    const images = createImageFiles();
    console.log(`Created ${images.length} image files`);

    // Delete existing images to start fresh
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        images: [],
        photoUrls: [],
      },
    });
    console.log('Removed existing images from property record');

    // Upload the new images
    const uploadedUrls = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      // Upload to Supabase
      const fileName = `${propertyId}/${Date.now()}-${image.name}`;
      console.log(`Uploading ${image.name} to ${BUCKET_NAME}/${fileName}...`);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, image.buffer, {
          contentType: image.type,
          upsert: true,
        });

      if (error) {
        console.error(`Failed to upload image ${i + 1}:`, error);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log(`Upload successful, URL: ${urlData.publicUrl}`);
      uploadedUrls.push(urlData.publicUrl);

      // Clean up temporary file
      fs.unlinkSync(image.path);
    }

    if (uploadedUrls.length === 0) {
      console.error('Failed to upload any images');
      return false;
    }

    // Update property with new image URLs
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        images: uploadedUrls,
        photoUrls: uploadedUrls,
      },
    });

    console.log(`Updated property with ${uploadedUrls.length} new images`);
    console.log('Image URLs:', uploadedUrls);

    // Verify update
    const updatedProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        images: true,
        photoUrls: true,
      },
    });

    console.log('Updated property:');
    console.log(`- Images: ${updatedProperty.images?.length || 0}`);
    console.log(`- PhotoUrls: ${updatedProperty.photoUrls?.length || 0}`);

    return true;
  } catch (err) {
    console.error('Error uploading images:', err);
    return false;
  } finally {
    await prisma.$disconnect();
  }
};

addImagesToProperty()
  .then((success) => {
    console.log(`\nOperation ${success ? 'COMPLETED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

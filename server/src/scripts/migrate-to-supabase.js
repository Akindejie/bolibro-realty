// Migration script for Supabase
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Verify environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Missing Supabase credentials in .env file');
  console.error('Make sure your .env file contains:');
  console.error('  SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('  SUPABASE_SERVICE_KEY=your-service-key');
  process.exit(1);
}

console.log('Starting Supabase migration with URL:', process.env.SUPABASE_URL);

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Prisma client
const prisma = require('../lib/prisma');

// Define image bucket name based on your Supabase bucket
const IMAGE_BUCKET_NAME = 'Property Images'; // Use the exact name from your Supabase account

// Function to migrate a file to Supabase
async function migrateFile(url, bucket, path) {
  try {
    console.log(`Fetching file from ${url}...`);
    // Fetch file from source
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    // Get file as buffer
    const buffer = await response.buffer();
    console.log(`Got file (${buffer.length} bytes)`);

    // Upload to Supabase
    console.log(`Uploading to ${bucket}/${path}...`);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error(`Upload error: ${error.message}`);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    console.log(`File uploaded successfully. Public URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Failed to migrate file ${url}:`, error);
    return null;
  }
}

async function migrateImages() {
  console.log('Starting image migration to Supabase...');

  try {
    // Test Supabase connection
    console.log('Testing Supabase connection...');
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error('ERROR: Failed to connect to Supabase:', listError);
      return;
    }

    console.log(
      `Connected to Supabase successfully. Found ${buckets.length} buckets.`
    );

    // Check if our image bucket exists
    const imageBucket = buckets.find((b) => b.name === IMAGE_BUCKET_NAME);

    if (!imageBucket) {
      console.error(
        `ERROR: Bucket "${IMAGE_BUCKET_NAME}" not found in your Supabase account.`
      );
      console.log('Available buckets:', buckets.map((b) => b.name).join(', '));
      console.log(
        `Please update the IMAGE_BUCKET_NAME variable in this script to match one of your existing buckets`
      );
      console.log(
        'OR create a new bucket with this exact name in your Supabase dashboard'
      );
      return;
    }

    console.log(`Using existing "${IMAGE_BUCKET_NAME}" bucket for migration`);

    // Get all properties with images
    console.log('Finding properties with images...');
    const properties = await prisma.property.findMany({
      where: {
        OR: [{ images: { isEmpty: false } }, { photoUrls: { isEmpty: false } }],
      },
      select: {
        id: true,
        images: true,
        photoUrls: true,
      },
    });

    console.log(`Found ${properties.length} properties with images`);

    // Migrate each property's images
    for (const property of properties) {
      const propertyId = property.id;
      const allImages = [
        ...(Array.isArray(property.images) ? property.images : []),
        ...(Array.isArray(property.photoUrls) ? property.photoUrls : []),
      ];
      const uniqueImages = [...new Set(allImages)].filter(Boolean);

      console.log(
        `Property ${propertyId}: Processing ${uniqueImages.length} images`
      );

      if (uniqueImages.length === 0) {
        console.log(`Property ${propertyId}: No images to migrate`);
        continue;
      }

      const newImageUrls = [];

      for (let i = 0; i < uniqueImages.length; i++) {
        const imageUrl = uniqueImages[i];
        // Skip if already a Supabase URL
        if (imageUrl.includes('supabase')) {
          console.log(
            `Image ${i + 1}/${
              uniqueImages.length
            }: Already on Supabase, skipping`
          );
          newImageUrls.push(imageUrl);
          continue;
        }

        const ext = imageUrl.split('.').pop()?.toLowerCase() || 'jpg';
        const validExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
          ? ext
          : 'jpg';

        const fileName = `migrated-${i + 1}-${Date.now()}.${validExt}`;
        const newPath = `${propertyId}/${fileName}`;

        console.log(
          `Property ${propertyId}: Migrating image ${i + 1}/${
            uniqueImages.length
          }`
        );
        console.log(`Source: ${imageUrl}`);
        console.log(`Target: ${IMAGE_BUCKET_NAME}/${newPath}`);

        const newUrl = await migrateFile(imageUrl, IMAGE_BUCKET_NAME, newPath);

        if (newUrl) {
          newImageUrls.push(newUrl);
          console.log(`✅ Success! New URL: ${newUrl}`);
        } else {
          console.error(`❌ Failed to migrate image`);
        }
      }

      // Update property with new URLs
      if (newImageUrls.length > 0) {
        console.log(
          `Updating property ${propertyId} with ${newImageUrls.length} new image URLs`
        );
        try {
          await prisma.property.update({
            where: { id: propertyId },
            data: {
              images: newImageUrls,
              photoUrls: newImageUrls,
            },
          });
          console.log(`✅ Updated property ${propertyId} successfully`);
        } catch (updateError) {
          console.error(
            `❌ Failed to update property ${propertyId}:`,
            updateError
          );
        }
      } else {
        console.log(`No images migrated for property ${propertyId}`);
      }
    }

    console.log('🎉 Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateImages()
  .then(() => console.log('Migration script completed successfully!'))
  .catch((err) => console.error('Script error:', err));

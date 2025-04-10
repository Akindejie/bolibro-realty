// Migration script for Supabase
// This script migrates images from external URLs to Supabase storage
// Usage: npm run migrate-images
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Create temp directory for image downloads
const tempDir = path.join(os.tmpdir(), 'bolibro-migration');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

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
const prisma = new PrismaClient();

// Define image bucket name based on your Supabase bucket
const IMAGE_BUCKET_NAME = 'Property Images'; // Use the exact name from your Supabase account

// Function to download a file from URL
async function downloadFile(url, outputPath) {
  try {
    console.log(`Downloading file from ${url}...`);

    // For data URLs
    if (url.startsWith('data:')) {
      const matches = url.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        fs.writeFileSync(outputPath, buffer);
        console.log(
          `Downloaded data URL to ${outputPath} (${buffer.length} bytes)`
        );
        return {
          success: true,
          contentType: matches[1],
          buffer,
        };
      }
      throw new Error('Invalid data URL format');
    }

    // For HTTP URLs
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB max
        headers: {
          'User-Agent': 'Bolibro-Migration-Script/1.0',
        },
      });

      const buffer = Buffer.from(response.data);
      fs.writeFileSync(outputPath, buffer);
      const contentType = response.headers['content-type'] || 'image/jpeg';

      console.log(
        `Downloaded ${url} to ${outputPath} (${buffer.length} bytes)`
      );
      return {
        success: true,
        contentType,
        buffer,
      };
    } catch (axiosError) {
      console.error(`Axios error downloading ${url}:`, axiosError.message);
      throw axiosError;
    }
  } catch (error) {
    console.error(`Failed to download file from ${url}:`, error.message);
    return {
      success: false,
      error,
    };
  }
}

// Function to migrate a file to Supabase
async function migrateFile(url, bucket, path) {
  try {
    console.log(`Preparing to migrate file from ${url}...`);

    // Create a temporary file path with unique name
    const fileExt = url.startsWith('data:')
      ? url.match(/^data:image\/(\w+);/)
        ? url.match(/^data:image\/(\w+);/)[1]
        : 'jpg'
      : url.split('.').pop()?.toLowerCase() || 'jpg';

    // Ensure valid extension
    const validExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)
      ? fileExt
      : 'jpg';
    const tempFilePath = `${tempDir}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${validExt}`;

    // Download the file
    const downloadResult = await downloadFile(url, tempFilePath);
    if (!downloadResult.success) {
      throw new Error(
        `Download failed: ${downloadResult.error?.message || 'Unknown error'}`
      );
    }

    // Skip empty files
    if (!downloadResult.buffer || downloadResult.buffer.length < 100) {
      throw new Error('File is too small or empty');
    }

    // Upload to Supabase
    console.log(
      `Uploading to ${bucket}/${path} (${downloadResult.buffer.length} bytes)...`
    );

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, downloadResult.buffer, {
          contentType: downloadResult.contentType,
          upsert: true, // Use upsert to replace existing files
        });

      if (error) {
        console.error(`Upload error: ${error.message}`);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      console.log(
        `File uploaded successfully. Public URL: ${urlData.publicUrl}`
      );

      // Clean up temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupErr) {
        console.warn(
          `Couldn't remove temp file ${tempFilePath}:`,
          cleanupErr.message
        );
      }

      return urlData.publicUrl;
    } catch (supabaseError) {
      console.error(
        `Supabase upload error for ${path}:`,
        supabaseError.message
      );
      throw supabaseError;
    }
  } catch (error) {
    console.error(`Failed to migrate file ${url}:`, error.message);
    return null;
  }
}

async function migrateImages() {
  console.log('Starting image migration to Supabase...');
  let totalImages = 0;
  let successfulMigrations = 0;
  let failedMigrations = 0;
  let propertiesProcessed = 0;
  let propertiesUpdated = 0;
  let propertiesWithErrors = 0;

  try {
    // Test Supabase connection
    console.log('Testing Supabase connection...');
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error('ERROR: Failed to connect to Supabase:', listError.message);
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
      propertiesProcessed++;
      const propertyId = property.id;
      const allImages = [
        ...(Array.isArray(property.images) ? property.images : []),
        ...(Array.isArray(property.photoUrls) ? property.photoUrls : []),
      ];
      const uniqueImages = [...new Set(allImages)].filter(Boolean);
      totalImages += uniqueImages.length;

      console.log(
        `Property ${propertyId} (${propertiesProcessed}/${properties.length}): Processing ${uniqueImages.length} images`
      );

      if (uniqueImages.length === 0) {
        console.log(`Property ${propertyId}: No images to migrate`);
        continue;
      }

      const newImageUrls = [];
      let propertyFailed = false;

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

        // Generate a clean file path
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 10);
        const ext = imageUrl.startsWith('data:')
          ? imageUrl.match(/^data:image\/(\w+);/)
            ? imageUrl.match(/^data:image\/(\w+);/)[1]
            : 'jpg'
          : imageUrl.split('.').pop()?.toLowerCase() || 'jpg';

        const validExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
          ? ext
          : 'jpg';

        const fileName = `migrated-${
          i + 1
        }-${timestamp}-${randomId}.${validExt}`;
        const newPath = `${propertyId}/${fileName}`;

        console.log(
          `Property ${propertyId}: Migrating image ${i + 1}/${
            uniqueImages.length
          }`
        );
        console.log(
          `Source: ${imageUrl.substring(0, 100)}${
            imageUrl.length > 100 ? '...' : ''
          }`
        );
        console.log(`Target: ${IMAGE_BUCKET_NAME}/${newPath}`);

        const newUrl = await migrateFile(imageUrl, IMAGE_BUCKET_NAME, newPath);

        if (newUrl) {
          newImageUrls.push(newUrl);
          console.log(`✅ Success! New URL: ${newUrl}`);
          successfulMigrations++;
        } else {
          console.error(`❌ Failed to migrate image`);
          failedMigrations++;
          propertyFailed = true;
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
              // Update photoUrls as well for backward compatibility
              photoUrls: newImageUrls,
            },
          });
          console.log(`✅ Updated property ${propertyId} successfully`);
          propertiesUpdated++;
        } catch (updateError) {
          console.error(
            `❌ Failed to update property ${propertyId}:`,
            updateError.message
          );
          propertiesWithErrors++;
        }
      } else if (propertyFailed) {
        propertiesWithErrors++;
      }
    }

    console.log('\n===== MIGRATION SUMMARY =====');
    console.log(`Total properties processed: ${propertiesProcessed}`);
    console.log(`Properties successfully updated: ${propertiesUpdated}`);
    console.log(`Properties with errors: ${propertiesWithErrors}`);
    console.log(`Total images processed: ${totalImages}`);
    console.log(`Successfully migrated: ${successfulMigrations}`);
    console.log(`Failed migrations: ${failedMigrations}`);
    console.log('=============================');
  } catch (error) {
    console.error('Migration failed with error:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('Migration script completed.');

    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`Cleaned up temporary directory: ${tempDir}`);
    } catch (error) {
      console.warn(`Could not clean up temporary directory: ${error.message}`);
    }
  }
}

// Run the migration function
migrateImages().catch((error) => {
  console.error('Error in migration script:', error.message);
  process.exit(1);
});

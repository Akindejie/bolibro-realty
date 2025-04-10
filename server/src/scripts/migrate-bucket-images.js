// Script to migrate images from old bucket to new bucket
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

// Configuration
const OLD_BUCKET = 'Property Images';
const NEW_BUCKET = 'property-images';

const prisma = new PrismaClient();

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

async function migrateImages() {
  console.log(`Starting migration from "${OLD_BUCKET}" to "${NEW_BUCKET}"...`);

  try {
    // First check if both buckets exist
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();

    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return;
    }

    const oldBucketExists = buckets.some((b) => b.name === OLD_BUCKET);
    const newBucketExists = buckets.some((b) => b.name === NEW_BUCKET);

    if (!oldBucketExists) {
      console.log(
        `Source bucket "${OLD_BUCKET}" does not exist. Nothing to migrate.`
      );
      return;
    }

    if (!newBucketExists) {
      console.log(
        `Destination bucket "${NEW_BUCKET}" does not exist. Creating it...`
      );
      try {
        const { error: createError } = await supabase.storage.createBucket(
          NEW_BUCKET,
          {
            public: true,
            allowedMimeTypes: ['image/*', 'application/pdf'],
            fileSizeLimit: 10485760, // 10MB
          }
        );

        if (createError) {
          if (
            createError.message &&
            createError.message.includes('already exists')
          ) {
            console.log(
              `Bucket "${NEW_BUCKET}" already exists (detected during creation).`
            );
          } else {
            console.error('Failed to create destination bucket:', createError);
            return;
          }
        }
      } catch (err) {
        if (err.message && err.message.includes('already exists')) {
          console.log(
            `Bucket "${NEW_BUCKET}" already exists (caught exception).`
          );
        } else {
          console.error('Error creating bucket:', err);
          return;
        }
      }
    } else {
      console.log(`Destination bucket "${NEW_BUCKET}" already exists.`);
    }

    // List all files in the old bucket
    console.log('Listing files in the source bucket...');
    const { data: files, error: listError } = await supabase.storage
      .from(OLD_BUCKET)
      .list();

    if (listError) {
      console.error('Error listing files in source bucket:', listError);
      return;
    }

    if (!files || files.length === 0) {
      console.log('No files found in the source bucket to migrate.');

      // Still proceed with database updates
      console.log('Will check database for references to update...');
    } else {
      console.log(`Found ${files.length} files to migrate`);

      // Migrate each file
      let successCount = 0;
      let failCount = 0;
      for (const file of files) {
        try {
          console.log(`Processing file: ${file.name}`);

          // Download the file from old bucket
          const { data: fileData, error: downloadError } =
            await supabase.storage.from(OLD_BUCKET).download(file.name);

          if (downloadError) {
            console.error(
              `Error downloading file "${file.name}":`,
              downloadError
            );
            failCount++;
            continue;
          }

          // Upload to new bucket with same name
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from(NEW_BUCKET)
              .upload(file.name, fileData, {
                contentType:
                  file.metadata?.mimetype || 'application/octet-stream',
                upsert: true,
              });

          if (uploadError) {
            console.error(
              `Error uploading file "${file.name}" to new bucket:`,
              uploadError
            );
            failCount++;
            continue;
          }

          // Get public URL of the new file
          const { data: publicUrlData } = supabase.storage
            .from(NEW_BUCKET)
            .getPublicUrl(file.name);

          console.log(`✓ Migrated: ${file.name}`);
          successCount++;
        } catch (err) {
          console.error(`Error processing file "${file.name}":`, err);
          failCount++;
        }
      }

      console.log(`\nFile migration complete:`);
      console.log(`- ${successCount} files migrated successfully`);
      console.log(`- ${failCount} files failed to migrate`);
    }

    // Update property records in database
    console.log('\nChecking database for URLs to update...');

    // Find all properties that might have references to the old bucket
    console.log('Querying database for properties with image URLs...');

    const properties = await prisma.property.findMany();
    console.log(`Found ${properties.length} total properties to check`);

    // Filter properties that have images using the old bucket name
    const propertiesToUpdate = properties.filter((p) => {
      const hasOldImageUrl = (p.images || []).some(
        (img) => img && img.includes(OLD_BUCKET.replace(' ', '%20'))
      );
      const hasOldPhotoUrl = (p.photoUrls || []).some(
        (url) => url && url.includes(OLD_BUCKET.replace(' ', '%20'))
      );
      return hasOldImageUrl || hasOldPhotoUrl;
    });

    console.log(
      `Found ${propertiesToUpdate.length} properties with images to update`
    );

    let propertiesUpdated = 0;
    for (const property of propertiesToUpdate) {
      try {
        console.log(`Updating property ${property.id}...`);

        // Update image URLs to use the new bucket
        const updatedImages = (property.images || []).map((img) =>
          img ? img.replace(OLD_BUCKET.replace(' ', '%20'), NEW_BUCKET) : img
        );

        const updatedPhotoUrls = (property.photoUrls || []).map((url) =>
          url ? url.replace(OLD_BUCKET.replace(' ', '%20'), NEW_BUCKET) : url
        );

        // Log the changes
        console.log(`Property ${property.id}:`);
        console.log(`- Original images: ${JSON.stringify(property.images)}`);
        console.log(`- Updated images: ${JSON.stringify(updatedImages)}`);
        console.log(
          `- Original photoUrls: ${JSON.stringify(property.photoUrls)}`
        );
        console.log(`- Updated photoUrls: ${JSON.stringify(updatedPhotoUrls)}`);

        // Update property in database
        await prisma.property.update({
          where: { id: property.id },
          data: {
            images: updatedImages,
            photoUrls: updatedPhotoUrls,
          },
        });

        console.log(`✓ Updated property ${property.id}`);
        propertiesUpdated++;
      } catch (err) {
        console.error(`Error updating property ${property.id}:`, err);
      }
    }

    console.log(
      `\nDatabase update complete: ${propertiesUpdated}/${propertiesToUpdate.length} properties updated`
    );
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrateImages()
  .then(() => {
    console.log('Migration process finished');
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

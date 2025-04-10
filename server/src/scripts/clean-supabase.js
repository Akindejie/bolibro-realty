/**
 * Script to clean all data from Supabase storage buckets
 * This will remove all files from the buckets but keep the buckets themselves
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanBucket(bucketName) {
  console.log(`Cleaning bucket: ${bucketName}`);

  try {
    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list();

    if (listError) {
      console.error(`Error listing files in bucket ${bucketName}:`, listError);
      return false;
    }

    if (!files || files.length === 0) {
      console.log(`No files found in bucket ${bucketName}`);
      return true;
    }

    console.log(`Found ${files.length} files in bucket ${bucketName}`);

    // Extract file paths
    const filePaths = files.map((file) => file.name);

    // Delete all files
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filePaths);

    if (deleteError) {
      console.error(
        `Error deleting files from bucket ${bucketName}:`,
        deleteError
      );
      return false;
    }

    console.log(`Successfully cleaned bucket ${bucketName}`);
    return true;
  } catch (error) {
    console.error(`Unexpected error cleaning bucket ${bucketName}:`, error);
    return false;
  }
}

async function listAndCleanAllBuckets() {
  try {
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }

    if (!buckets || buckets.length === 0) {
      console.log('No buckets found');
      return;
    }

    console.log(`Found ${buckets.length} buckets`);

    // Clean each bucket
    for (const bucket of buckets) {
      await cleanBucket(bucket.name);
    }

    console.log('Finished cleaning all buckets');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
listAndCleanAllBuckets();

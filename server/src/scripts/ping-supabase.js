require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

// Check if we should skip database ping (command line argument)
const skipDatabase = process.argv.includes('--skip-db');

// Initialize Prisma client only if we're not skipping database
const prisma = skipDatabase ? null : new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function pingDatabase() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Starting ping process...`);

  let databaseSuccess = true;
  let storageSuccess = true;

  // Step 1: Ping database if not skipped
  if (!skipDatabase) {
    try {
      console.log(`[${timestamp}] Pinging database...`);
      const prismaResult = await prisma.$queryRaw`SELECT 1 as connected`;
      console.log(`[${timestamp}] ✅ Prisma ping successful:`, prismaResult);
    } catch (error) {
      console.error(`[${timestamp}] ❌ Database ping failed:`, error.message);
      databaseSuccess = false;
    }
  } else {
    console.log(
      `[${timestamp}] Skipping database ping (--skip-db flag detected)`
    );
  }

  // Step 2: Ping Supabase storage (always do this)
  try {
    console.log(`[${timestamp}] Pinging Supabase storage...`);
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error(`[${timestamp}] ❌ Supabase storage ping failed:`, error);
      storageSuccess = false;
    } else {
      console.log(
        `[${timestamp}] ✅ Supabase storage ping successful. Found ${buckets.length} buckets.`
      );

      // Optionally list some files from a bucket
      if (buckets.length > 0) {
        try {
          const firstBucket = buckets[0].name;
          const { data: files, error: filesError } = await supabase.storage
            .from(firstBucket)
            .list();

          if (filesError) {
            console.error(`Error listing files: ${filesError.message}`);
          } else {
            console.log(
              `Found ${files.length} files/folders in "${firstBucket}"`
            );
          }
        } catch (listError) {
          console.error('Error listing files:', listError);
        }
      }
    }
  } catch (error) {
    console.error(
      `[${timestamp}] ❌ Error pinging Supabase storage:`,
      error.message
    );
    storageSuccess = false;
  }

  // Overall success is true if we're skipping database OR database ping succeeded, AND storage ping succeeded
  return (skipDatabase || databaseSuccess) && storageSuccess;
}

// Function to run the ping at regular intervals
function startPingSchedule(intervalMinutes = 1, forceSkipDb = false) {
  // Override skipDatabase if forceSkipDb is true
  if (forceSkipDb) {
    console.log('Forcing database ping to be skipped (parameter override)');
    global.skipDatabase = true;
  }

  // Run initial ping immediately
  pingDatabase();

  // Set up regular interval (convert minutes to milliseconds)
  const interval = intervalMinutes * 60 * 1000;

  // Schedule regular pings
  setInterval(pingDatabase, interval);

  console.log(
    `Ping scheduler started. Will ping ${
      skipDatabase || forceSkipDb ? 'only storage' : 'database and storage'
    } every ${intervalMinutes} minutes.`
  );
}

// When running this script directly
if (require.main === module) {
  const intervalArg = process.argv.find((arg) => arg.startsWith('--interval='));
  const interval = intervalArg ? parseInt(intervalArg.split('=')[1], 10) : 1;

  startPingSchedule(interval); // Ping every X minutes (default: 1)
}

// Export for use in other files
module.exports = {
  pingDatabase,
  startPingSchedule,
};

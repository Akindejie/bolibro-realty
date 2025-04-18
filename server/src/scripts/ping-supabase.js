// Supabase ping module
// This script keeps connections alive by pinging Supabase services at regular intervals

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config();

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Use a singleton pattern for the Prisma Client
const prisma = (() => {
  let instance = null;

  function getInstance() {
    if (!instance) {
      try {
        const { prisma: prismaClient } = require('../lib/prisma'); // Adjust the path if needed
        instance = prismaClient;
      } catch (error) {
        console.warn(
          'prisma.ts not found in lib folder.  Creating a new PrismaClient instance.'
        );
        instance = new PrismaClient({
          log: ['error'],
          errorFormat: 'minimal',
        });
      }
    }
    return instance;
  }
  return getInstance();
})();

// Initialize Supabase for storage pings
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Track consecutive failures to implement exponential backoff
let consecutiveDbFailures = 0;
let consecutiveStorageFailures = 0;
const MAX_BACKOFF_MINUTES = 30; // Maximum backoff time
const BASE_BACKOFF_TIME = 1; // Base time in minutes

/**
 * Calculate backoff time with exponential increase
 * @param {number} consecutiveFailures - Number of consecutive failures
 * @returns {number} - Backoff time in minutes
 */
function calculateBackoffTime(consecutiveFailures) {
  // Exponential backoff: 2^failures minutes with a cap
  const backoffMinutes = Math.min(
    BASE_BACKOFF_TIME * Math.pow(2, consecutiveFailures),
    MAX_BACKOFF_MINUTES
  );
  return backoffMinutes;
}

/**
 * Ping the database to keep the connection alive
 * @returns {Promise<boolean>} - Success status
 */
async function pingDatabase() {
  try {
    console.log('[' + new Date().toISOString() + '] Pinging database...');
    // Simple query to check database connectivity
    const result = await prisma.$queryRaw`SELECT 1 as connected`;

    console.log(
      '[' + new Date().toISOString() + '] ✅ Prisma ping successful:',
      result
    );
    // Reset consecutive failures on success
    consecutiveDbFailures = 0;
    return true;
  } catch (error) {
    console.error(
      '[' + new Date().toISOString() + '] ❌ Prisma ping failed:',
      error.message
    );
    // Increment consecutive failures
    consecutiveDbFailures++;
    return false;
  }
}

/**
 * Ping Supabase storage to keep the connection alive
 * @returns {Promise<boolean>} - Success status
 */
async function pingStorage() {
  try {
    console.log(
      '[' + new Date().toISOString() + '] Pinging Supabase storage...'
    );
    // List buckets to check storage connectivity
    const { data, error } = await supabase.storage.listBuckets();

    if (error) throw error;

    console.log(
      '[' +
        new Date().toISOString() +
        '] ✅ Supabase storage ping successful. Found ' +
        data.length +
        ' buckets.'
    );

    // List files in a bucket as an additional check (if buckets exist)
    if (data.length > 0) {
      try {
        const { data: files, error: filesError } = await supabase.storage
          .from(data[0].name)
          .list();

        if (!filesError) {
          console.log(
            `Found ${files?.length || 0} files/folders in "${data[0].name}"`
          );
        }
      } catch (listError) {
        console.warn('Could not list files in bucket:', listError.message);
      }
    }

    // Reset consecutive failures on success
    consecutiveStorageFailures = 0;
    return true;
  } catch (error) {
    console.error(
      '[' + new Date().toISOString() + '] ❌ Supabase storage ping failed:',
      error.message
    );
    // Increment consecutive failures
    consecutiveStorageFailures++;
    return false;
  }
}

/**
 * Start pinging Supabase services at specified intervals
 * @param {number} intervalMinutes - Interval in minutes between pings
 * @param {boolean} forceSkipDb - Force skip database pings (for when DB is known to be down)
 */
function startPingSchedule(intervalMinutes = 10, forceSkipDb = false) {
  console.log(
    'Ping scheduler started. Will ping' +
      (forceSkipDb ? ' only storage' : ' database and storage') +
      ' every ' +
      intervalMinutes +
      ' minutes.'
  );

  let dbPingInterval = null;
  let storagePingInterval = null;

  // Initial pings
  if (!forceSkipDb) {
    pingDatabase();
  } else {
    console.log('Forcing database ping to be skipped (parameter override)');
  }
  pingStorage();

  // Setup regular ping for database
  if (!forceSkipDb) {
    dbPingInterval = setInterval(async () => {
      const success = await pingDatabase();

      // If ping fails, adjust interval with backoff
      if (!success && dbPingInterval) {
        clearInterval(dbPingInterval);
        const backoffMinutes = calculateBackoffTime(consecutiveDbFailures);
        console.log(
          `Database ping failed. Backing off for ${backoffMinutes} minutes before next attempt.`
        );

        // Setup new interval with backoff
        dbPingInterval = setInterval(async () => {
          const retrySuccess = await pingDatabase();

          // If ping succeeds, reset to normal interval
          if (retrySuccess) {
            clearInterval(dbPingInterval);
            dbPingInterval = setInterval(
              () => pingDatabase(),
              intervalMinutes * 60 * 1000
            );
            console.log(
              `Database ping recovered. Resetting to normal interval of ${intervalMinutes} minutes.`
            );
          }
        }, backoffMinutes * 60 * 1000);
      }
    }, intervalMinutes * 60 * 1000);
  }

  // Setup regular ping for storage
  storagePingInterval = setInterval(async () => {
    const success = await pingStorage();

    // If ping fails, adjust interval with backoff
    if (!success && storagePingInterval) {
      clearInterval(storagePingInterval);
      const backoffMinutes = calculateBackoffTime(consecutiveStorageFailures);
      console.log(
        `Storage ping failed. Backing off for ${backoffMinutes} minutes before next attempt.`
      );

      // Setup new interval with backoff
      storagePingInterval = setInterval(async () => {
        const retrySuccess = await pingStorage();

        // If ping succeeds, reset to normal interval
        if (retrySuccess) {
          clearInterval(storagePingInterval);
          storagePingInterval = setInterval(
            () => pingStorage(),
            intervalMinutes * 60 * 1000
          );
          console.log(
            `Storage ping recovered. Resetting to normal interval of ${intervalMinutes} minutes.`
          );
        }
      }, backoffMinutes * 60 * 1000);
    }
  }, intervalMinutes * 60 * 1000);
}

// For command-line usage
if (require.main === module) {
  const interval = process.argv[2] ? parseInt(process.argv[2], 10) : 10;
  console.log(
    `Starting Supabase ping scheduler with ${interval} minute interval`
  );
  startPingSchedule(interval); // Ping every X minutes (default: 10)
}

module.exports = {
  pingDatabase,
  pingStorage,
  startPingSchedule,
};

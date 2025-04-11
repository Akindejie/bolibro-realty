require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const databaseUrl = process.env.DATABASE_URL;

console.log('=== SUPABASE CONNECTION TEST ===');
console.log('Testing connection to Supabase services...');

// Check environment variables
console.log('\n1. Checking environment variables:');
console.log(`- SUPABASE_URL: ${supabaseUrl ? '✅ Defined' : '❌ Missing'}`);
console.log(
  `- SUPABASE_SERVICE_KEY: ${supabaseKey ? '✅ Defined' : '❌ Missing'}`
);
console.log(`- DATABASE_URL: ${databaseUrl ? '✅ Defined' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Missing required Supabase credentials. Please check your .env file.'
  );
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test functions
async function testStorage() {
  console.log('\n2. Testing Storage API:');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error(`❌ Storage API Error: ${error.message}`);
      return false;
    }

    console.log(`✅ Successfully connected to Storage API`);
    console.log(
      `- Available buckets: ${buckets.map((b) => `"${b.name}"`).join(', ')}`
    );

    // Test a specific bucket access
    if (buckets.length > 0) {
      const firstBucket = buckets[0].name;
      console.log(`- Testing access to bucket "${firstBucket}"...`);

      const { data: files, error: listError } = await supabase.storage
        .from(firstBucket)
        .list();

      if (listError) {
        console.log(`❌ Could not list files in bucket: ${listError.message}`);
      } else {
        console.log(
          `✅ Successfully listed ${files.length} files/folders in bucket`
        );
      }
    }

    return true;
  } catch (err) {
    console.error(`❌ Storage API unexpected error: ${err.message}`);
    return false;
  }
}

async function testDatabase() {
  console.log('\n3. Testing Database Connection:');
  try {
    // Simple query to check database connection
    const { data, error } = await supabase
      .from('_prisma_migrations')
      .select('*')
      .limit(1);

    if (error) {
      console.error(`❌ Database Error: ${error.message}`);
      return false;
    }

    console.log('✅ Successfully connected to database');
    return true;
  } catch (err) {
    console.error(`❌ Database unexpected error: ${err.message}`);
    return false;
  }
}

async function testAuth() {
  console.log('\n4. Testing Auth API:');
  try {
    // We can't list users without admin privileges, but we can check if the service is running
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error(`❌ Auth API Error: ${error.message}`);
      return false;
    }

    console.log('✅ Successfully connected to Auth API');
    return true;
  } catch (err) {
    console.error(`❌ Auth API unexpected error: ${err.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  const storageResult = await testStorage();
  const dbResult = await testDatabase();
  const authResult = await testAuth();

  console.log('\n=== TEST SUMMARY ===');
  console.log(`Storage API: ${storageResult ? '✅ CONNECTED' : '❌ FAILED'}`);
  console.log(`Database:    ${dbResult ? '✅ CONNECTED' : '❌ FAILED'}`);
  console.log(`Auth API:    ${authResult ? '✅ CONNECTED' : '❌ FAILED'}`);

  if (!storageResult || !dbResult || !authResult) {
    console.log(
      '\n⚠️ Some tests failed. Check the details above for troubleshooting.'
    );

    // Database-specific advice
    if (!dbResult) {
      console.log('\n📌 Database Connection Troubleshooting:');
      console.log(
        '- Verify your Supabase project is not paused in the dashboard'
      );
      console.log(
        '- Free tier databases auto-pause after periods of inactivity'
      );
      console.log(
        '- Try manually waking up the database by running a query in the Supabase SQL Editor'
      );
      console.log(
        '- Check that your DATABASE_URL in .env matches the connection string from Supabase'
      );
      console.log(
        '- Check if your IP address is allowed in the database connection settings'
      );
    }
  } else {
    console.log(
      '\n✅ All Supabase services are connected and working properly!'
    );
  }
}

runTests();

// Test script to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Verify environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Missing Supabase credentials in .env file');
  console.error('Please make sure your .env file contains:');
  console.error('  SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('  SUPABASE_SERVICE_KEY=your-service-key');
  process.exit(1);
}

// Create Supabase client
console.log('Initializing Supabase client with URL:', process.env.SUPABASE_URL);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Test connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');

    // Test storage connection
    console.log('Checking storage buckets...');
    const { data: buckets, error: storageError } =
      await supabase.storage.listBuckets();

    if (storageError) {
      console.error('❌ Storage connection failed:', storageError);
      return;
    }

    console.log('✅ Successfully connected to Supabase Storage!');
    console.log(`Found ${buckets.length} buckets:`);
    buckets.forEach((bucket) => {
      console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    // Check if our image bucket exists (check multiple possible names)
    const possibleBucketNames = [
      'property-images',
      'Property Images',
      'property_images',
      'PropertyImages',
    ];
    const imageBucket = buckets.find((b) =>
      possibleBucketNames.includes(b.name)
    );

    if (imageBucket) {
      console.log(`✅ Found image bucket: "${imageBucket.name}"`);

      // List files in the found bucket
      const { data: files, error: listError } = await supabase.storage
        .from(imageBucket.name)
        .list();

      if (listError) {
        console.error('❌ Failed to list files:', listError);
      } else {
        console.log(
          `Found ${files.length} files/folders in "${imageBucket.name}" bucket`
        );
        if (files.length > 0) {
          console.log('First 5 items:');
          files.slice(0, 5).forEach((file) => {
            console.log(
              `- ${file.name} (${file.metadata?.mimetype || 'folder'})`
            );
          });
        }
      }

      // Save the correct bucket name for the migration script
      console.log(
        '\n>> IMPORTANT: Update your migration script to use this bucket name:'
      );
      console.log(`   Bucket name to use: "${imageBucket.name}"`);
    } else {
      console.log('❌ No image bucket found with standard names');
      console.log('Available buckets:', buckets.map((b) => b.name).join(', '));
      console.log(
        'Run the migration script to create the property-images bucket'
      );
    }

    // Test database connection using a simple query instead of rpc
    console.log('\nTesting database connection...');
    const { data: versionData, error: dbError } = await supabase
      .from('_prisma_migrations') // A table that should exist if you're using Prisma
      .select('*')
      .limit(1);

    if (dbError) {
      console.error(
        '❌ Database connection test failed with _prisma_migrations:',
        dbError
      );

      // Try a different approach - just run a simple query
      const { data, error } = await supabase.rpc('get_server_version');

      if (error) {
        console.error(
          '❌ Database connection test failed with get_server_version:',
          error
        );
        console.log('Trying direct SQL query...');

        // Try one more approach with raw SQL
        const { data: rawData, error: rawError } = await supabase
          .from('_prisma_migrations')
          .select('count(*)')
          .limit(1)
          .single();

        if (rawError) {
          console.error('❌ All database connection tests failed');
          console.log(
            'This might be expected if your database is completely empty'
          );
          console.log(
            'You should still be able to migrate images if storage connection works'
          );
        } else {
          console.log(
            '✅ Successfully connected to Supabase Database with direct query!'
          );
          console.log('Database migration count:', rawData);
        }
      } else {
        console.log('✅ Successfully connected to Supabase Database with RPC!');
        console.log('Database version:', data);
      }
    } else {
      console.log('✅ Successfully connected to Supabase Database!');
      console.log('Found Prisma migrations table with entries');
    }
  } catch (error) {
    console.error('❌ Connection test failed with error:', error);
  }
}

// Run the test
testConnection()
  .then(() => console.log('\nConnection test completed.'))
  .catch((err) => console.error('Script error:', err));

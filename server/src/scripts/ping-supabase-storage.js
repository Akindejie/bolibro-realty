#!/usr/bin/env node

/**
 * This script pings only the Supabase storage service, without using Prisma
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env file.');
  console.error(`SUPABASE_URL defined: ${!!supabaseUrl}`);
  console.error(`SUPABASE_SERVICE_KEY defined: ${!!supabaseKey}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function pingSupabaseStorage() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Pinging Supabase storage...`);
  
  try {
    // Ping Supabase storage by listing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error(`[${timestamp}] ❌ Supabase storage ping failed:`, error);
      return false;
    } else {
      console.log(`[${timestamp}] ✅ Supabase storage ping successful!`);
      console.log(`Found ${buckets.length} buckets:`, buckets.map(b => b.name).join(', '));
      
      // Optional: List some files from one of the buckets if any exist
      if (buckets.length > 0) {
        const firstBucket = buckets[0].name;
        console.log(`Listing files in bucket "${firstBucket}":`);
        
        const { data: files, error: filesError } = await supabase.storage
          .from(firstBucket)
          .list();
          
        if (filesError) {
          console.error(`Error listing files: ${filesError.message}`);
        } else {
          console.log(`Found ${files.length} files/folders in "${firstBucket}"`);
          if (files.length > 0) {
            console.log('First 5 items:', files.slice(0, 5).map(f => f.name));
          }
        }
      }
      
      return true;
    }
  } catch (error) {
    console.error(`[${timestamp}] ❌ Error pinging Supabase storage:`, error.message);
    return false;
  }
}

// Run the ping
pingSupabaseStorage()
  .then(success => {
    if (success) {
      console.log('Supabase storage ping successful');
      process.exit(0);
    } else {
      console.error('Supabase storage ping failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error during ping:', error);
    process.exit(1);
  }); 
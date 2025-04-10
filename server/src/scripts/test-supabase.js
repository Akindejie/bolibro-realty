require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('Environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log(
  'SUPABASE_SERVICE_KEY length:',
  process.env.SUPABASE_SERVICE_KEY
    ? process.env.SUPABASE_SERVICE_KEY.length
    : 'undefined'
);

async function testSupabase() {
  try {
    console.log('Creating Supabase client...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    console.log('Testing Supabase connection by listing buckets...');
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error connecting to Supabase:', error);
      return;
    }

    console.log('Successfully connected to Supabase!');
    console.log(
      'Buckets:',
      data.map((b) => b.name)
    );
  } catch (err) {
    console.error('Error testing Supabase:', err);
  }
}

testSupabase();

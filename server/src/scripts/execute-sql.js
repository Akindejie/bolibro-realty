/**
 * Script to execute SQL directly against the Supabase database
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

const clearDatabaseSQL = `
-- Disable triggers temporarily to avoid foreign key issues
SET session_replication_role = 'replica';

-- Delete all data from tables
DELETE FROM "Payment";
DELETE FROM "Application";
DELETE FROM "Lease";
DELETE FROM "_TenantFavorites";
DELETE FROM "_TenantProperties";
DELETE FROM "Property";
DELETE FROM "Location";
DELETE FROM "Tenant";
DELETE FROM "Manager";

-- Re-enable triggers
SET session_replication_role = 'origin';
`;

async function executeSql() {
  try {
    console.log('Executing SQL to clear database...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: clearDatabaseSQL,
    });

    if (error) {
      console.error('Error executing SQL:', error);

      // Try alternative approach with direct queries
      console.log('Trying alternative approach with direct delete queries...');

      // Try deleting from each table directly
      const tables = [
        'Payment',
        'Application',
        'Lease',
        '_TenantFavorites',
        '_TenantProperties',
        'Property',
        'Location',
        'Tenant',
        'Manager',
      ];

      for (const table of tables) {
        console.log(`Attempting to delete from ${table}...`);
        const { error: deleteError } = await supabase
          .from(table.toLowerCase())
          .delete()
          .is('id', '*'); // Attempt to match all rows

        if (deleteError) {
          console.error(`Error deleting from ${table}:`, deleteError);
        } else {
          console.log(`Successfully deleted from ${table}`);
        }
      }
    } else {
      console.log('SQL executed successfully:', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the execution
executeSql()
  .then(() => {
    console.log('Process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

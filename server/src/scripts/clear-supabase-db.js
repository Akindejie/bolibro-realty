/**
 * Script to clear data directly from Supabase database tables
 * This uses the Supabase client rather than Prisma
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

// Define tables in dependency order (child tables first)
const tables = [
  'Payment',
  'Application',
  'Lease',
  'Property',
  'Location',
  'Tenant',
  'Manager',
];

async function clearTable(tableName) {
  try {
    console.log(`Clearing table: ${tableName}...`);

    // Delete all data from the table
    // Note: Convert tableName to lowercase for Supabase
    const { error } = await supabase
      .from(tableName.toLowerCase())
      .delete()
      .neq('id', 0); // This will match all rows since id is always > 0

    if (error) {
      console.error(`Error clearing table ${tableName}:`, error);
      return false;
    }

    console.log(`Successfully cleared table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Unexpected error clearing table ${tableName}:`, error);
    return false;
  }
}

async function clearJunctionTables() {
  try {
    // Clear junction tables for many-to-many relationships
    console.log('Clearing junction tables...');

    const junctionTables = ['_TenantFavorites', '_TenantProperties'];

    for (const table of junctionTables) {
      console.log(`Clearing junction table: ${table}...`);

      const { error } = await supabase
        .from(table.toLowerCase())
        .delete()
        .gte('id', 0); // Match all rows

      if (error) {
        console.error(`Error clearing junction table ${table}:`, error);
      } else {
        console.log(`Successfully cleared junction table: ${table}`);
      }
    }
  } catch (error) {
    console.error('Error clearing junction tables:', error);
  }
}

async function listTables() {
  try {
    console.log('Listing all tables in the database...');

    // Query to get all tables from the public schema
    const { data, error } = await supabase.rpc('list_tables');

    if (error) {
      console.error('Error listing tables:', error);
      return [];
    }

    console.log('Available tables:', data);
    return data;
  } catch (error) {
    console.error('Error listing tables:', error);
    return [];
  }
}

async function clearDatabase() {
  try {
    console.log('Starting database clear operation...');

    // First, get the actual tables from the database
    const availableTables = await listTables();

    if (!availableTables || availableTables.length === 0) {
      console.log(
        'No tables found or unable to list tables. Creating stored procedure...'
      );

      // Create a stored procedure to list tables
      const { error: procError } = await supabase.rpc(
        'create_list_tables_function',
        {
          sql: `
          CREATE OR REPLACE FUNCTION list_tables()
          RETURNS TABLE(table_name text) AS $$
          BEGIN
            RETURN QUERY SELECT tablename::text FROM pg_tables WHERE schemaname = 'public';
          END;
          $$ LANGUAGE plpgsql;
        `,
        }
      );

      if (procError) {
        console.error('Error creating stored procedure:', procError);
      } else {
        console.log(
          'Stored procedure created successfully. Please run the script again.'
        );
      }

      return;
    }

    // Clear junction tables first
    await clearJunctionTables();

    // Then clear regular tables in order
    for (const tableName of tables) {
      // Check if the table exists in the available tables
      if (availableTables.includes(tableName.toLowerCase())) {
        await clearTable(tableName);
      } else {
        console.log(`Table ${tableName} not found, skipping...`);
      }
    }

    console.log('Database clear operation completed');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

// Run the clear operation
clearDatabase()
  .then(() => {
    console.log('Database clear process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

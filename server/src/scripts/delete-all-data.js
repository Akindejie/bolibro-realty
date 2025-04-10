/**
 * Script to delete all data from Supabase tables using the REST API
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

// Tables in delete order (child tables first to avoid foreign key issues)
const tables = [
  'payment',
  'application',
  'lease',
  'property',
  'location',
  'tenant',
  'manager',
];

// Special case for junction tables (these might not have id columns)
const junctionTables = ['_tenantfavorites', '_tenantproperties'];

async function getAllIds(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('id');

    if (error) {
      console.error(`Error getting IDs from ${tableName}:`, error);
      return [];
    }

    return data.map((item) => item.id);
  } catch (error) {
    console.error(`Unexpected error getting IDs from ${tableName}:`, error);
    return [];
  }
}

async function deleteAllRows(tableName) {
  try {
    console.log(`Deleting all rows from ${tableName}...`);

    // First, get all IDs
    const ids = await getAllIds(tableName);

    if (ids.length === 0) {
      console.log(`No rows found in ${tableName}`);
      return true;
    }

    console.log(`Found ${ids.length} rows in ${tableName}`);

    // Delete all rows by ID
    const { error } = await supabase.from(tableName).delete().in('id', ids);

    if (error) {
      console.error(`Error deleting from ${tableName}:`, error);
      return false;
    }

    console.log(`Successfully deleted ${ids.length} rows from ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Unexpected error deleting from ${tableName}:`, error);
    return false;
  }
}

async function deleteJunctionTable(tableName) {
  try {
    console.log(`Attempting to delete all from junction table ${tableName}...`);

    // For junction tables, we'll try a different approach since they might not have standard IDs
    // First, let's try to select one row to see the structure
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
      console.error(`Error accessing junction table ${tableName}:`, error);
      return false;
    }

    if (!data || data.length === 0) {
      console.log(`No rows found in junction table ${tableName}`);
      return true;
    }

    // Get all rows (limited to 1000 to avoid overloading)
    const { data: allRows, error: selectError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1000);

    if (selectError) {
      console.error(
        `Error selecting from junction table ${tableName}:`,
        selectError
      );
      return false;
    }

    console.log(`Found ${allRows.length} rows in junction table ${tableName}`);

    // Delete each row individually
    let successCount = 0;

    for (const row of allRows) {
      // Create a filter based on all fields in the row
      const filters = Object.entries(row).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

      // Delete using all fields as a composite filter
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .match(filters);

      if (deleteError) {
        console.error(`Error deleting row from ${tableName}:`, deleteError);
      } else {
        successCount++;
      }
    }

    console.log(
      `Successfully deleted ${successCount} out of ${allRows.length} rows from ${tableName}`
    );
    return successCount > 0;
  } catch (error) {
    console.error(`Unexpected error with junction table ${tableName}:`, error);
    return false;
  }
}

async function deleteAllData() {
  console.log('Starting data deletion process...');

  // Delete from junction tables first
  for (const table of junctionTables) {
    await deleteJunctionTable(table);
  }

  // Delete from regular tables in order
  for (const table of tables) {
    await deleteAllRows(table);
  }

  console.log('Data deletion process completed');
}

// Run the deletion process
deleteAllData()
  .then(() => {
    console.log('All operations completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

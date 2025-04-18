// Script to list all database schemas and tables
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Use a singleton pattern for the Prisma Client
const prisma = (() => {
  let instance = null;

  function getInstance() {
    if (!instance) {
      instance = new PrismaClient();
    }
    return instance;
  }

  return getInstance();
})();

async function listDatabaseSchema() {
  try {
    console.log('Checking database schemas and tables...');

    // Use a raw query to get all schemas
    const schemas = await prisma.$queryRaw`
      SELECT nspname AS schema_name
      FROM pg_catalog.pg_namespace
      WHERE nspname !~ '^pg_' 
        AND nspname != 'information_schema'
      ORDER BY schema_name;
    `;

    console.log(`\nFound ${schemas.length} schemas:`);
    for (const schema of schemas) {
      console.log(`\n--- Schema: ${schema.schema_name} ---`);

      // Get all tables for this schema
      const tables = await prisma.$queryRaw`
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = ${schema.schema_name}
        ORDER BY table_name;
      `;

      if (tables.length === 0) {
        console.log('  No tables found');
      } else {
        console.log(`  Found ${tables.length} tables/views:`);

        for (const table of tables) {
          console.log(`  - ${table.table_name} (${table.table_type})`);

          // For regular tables, get column info
          if (table.table_type === 'BASE TABLE') {
            const columns = await prisma.$queryRaw`
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_schema = ${schema.schema_name}
                AND table_name = ${table.table_name}
              ORDER BY ordinal_position;
            `;

            if (columns.length > 0) {
              console.log('    Columns:');
              for (const column of columns) {
                console.log(
                  `    · ${column.column_name} (${column.data_type}, nullable: ${column.is_nullable})`
                );
              }
            }
          }
        }
      }
    }

    // Also check Prisma schema
    console.log('\n=== Prisma Schema Models ===');
    const dmmf = await prisma._getDmmf();
    const models = dmmf.datamodel.models;

    console.log(`Found ${models.length} models in Prisma schema:`);
    for (const model of models) {
      console.log(`- ${model.name} (${model.fields.length} fields)`);
    }
  } catch (error) {
    console.error('Error inspecting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listDatabaseSchema()
  .then(() => {
    console.log('\nDatabase inspection complete');
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

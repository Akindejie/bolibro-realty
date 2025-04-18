/**
 * Script to check database connection using a Singleton Prisma Client
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Use a singleton pattern to ensure only one PrismaClient instance is created
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

async function checkDatabaseConnection() {
  console.log('Database connection check starting...');
  console.log(
    `Using DATABASE_URL: ${
      process.env.DATABASE_URL ? '(connection string set)' : '(missing)'
    }`
  );

  try {
    // Try a simple query to check connection
    console.log('Attempting to connect to database...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;

    console.log('\n✅ DATABASE CONNECTION SUCCESSFUL!');
    console.log('Query result:', result);

    // Check if we can access the Properties table
    console.log('\nTrying to count properties...');
    const propertyCount = await prisma.property.count();
    console.log(`Found ${propertyCount} properties in the database.`);

    return true;
  } catch (error) {
    console.error('\n❌ DATABASE CONNECTION FAILED!');
    console.error('Error details:', error.message);

    // Provide troubleshooting steps
    console.log('\n🔍 TROUBLESHOOTING STEPS:');
    console.log(
      '1. Check if your Supabase project is paused in the Supabase dashboard'
    );
    console.log('2. Verify your DATABASE_URL in the .env file is correct');
    console.log('3. Check if your IP address is allowed in Supabase settings');
    console.log(
      "4. Make sure you haven't exceeded connection limits on your plan"
    );

    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabaseConnection()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error during database check:', error);
    process.exit(1);
  });

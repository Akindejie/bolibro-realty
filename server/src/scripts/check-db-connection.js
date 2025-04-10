/**
 * Script to check database connection
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Create a new Prisma client
const prisma = new PrismaClient();

async function checkConnection() {
  try {
    console.log('Environment variables:');
    console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

    if (process.env.DATABASE_URL) {
      // Print masked version of the connection string
      const url = new URL(process.env.DATABASE_URL);
      console.log('Connection details:');
      console.log('- Protocol:', url.protocol);
      console.log('- Host:', url.hostname);
      console.log('- Port:', url.port);
      console.log('- Database:', url.pathname.substring(1));
      console.log('- Username:', url.username);
      console.log('- Password:', url.password ? '******' : 'not set');
    }

    console.log('\nTrying to connect to database...');

    // Try a simple query to check connectivity
    const result = await prisma.$queryRaw`SELECT 1 as connected`;

    console.log('\nConnection successful!');
    console.log('Query result:', result);

    return true;
  } catch (error) {
    console.error('\nConnection failed:');
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkConnection()
  .then((success) => {
    console.log('\nCheck completed.');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\nUnexpected error:', error);
    process.exit(1);
  });

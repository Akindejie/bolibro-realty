// Test script for Prisma database connection
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testPrisma() {
  console.log('=== PRISMA DATABASE CONNECTION TEST ===');
  console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);

  // Create Prisma client
  const prisma = new PrismaClient();

  try {
    console.log('Connecting to database...');

    // Test with a raw query first
    console.log('\n1. Testing with raw SQL query:');
    try {
      const result = await prisma.$queryRaw`SELECT NOW()`;
      console.log('✅ Raw query successful:', result);
    } catch (error) {
      console.error('❌ Raw query failed:', error.message);
    }

    // Try checking for tables
    console.log('\n2. Testing model access:');
    try {
      // Try to count users - adjust model name if needed
      const userCount = await prisma.user.count();
      console.log(`✅ User count: ${userCount}`);
    } catch (error) {
      console.error('❌ Model access failed:', error.message);

      // If first attempt fails, try another model
      try {
        console.log('Trying alternative model...');
        const propertyCount = await prisma.property.count();
        console.log(`✅ Property count: ${propertyCount}`);
      } catch (error2) {
        console.error('❌ Alternative model access failed:', error2.message);
      }
    }

    console.log('\nIf all tests failed, troubleshooting steps:');
    console.log(
      '1. Verify database is awake by running a query in Supabase SQL Editor'
    );
    console.log(
      '2. Check DATABASE_URL in .env matches Supabase connection string'
    );
    console.log('3. Confirm schema exists and tables are properly migrated');
    console.log('4. Check for proper permissions on the schema and tables');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();

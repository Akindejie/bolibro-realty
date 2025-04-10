/**
 * Script to reset the database by deleting all rows from all tables while keeping the schema intact
 * This provides a clean slate for testing
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('Starting database reset...');

  try {
    // Delete in order to respect foreign key constraints
    // Start with child tables that depend on others

    console.log('Deleting payments...');
    await prisma.payment.deleteMany();

    console.log('Deleting applications...');
    await prisma.application.deleteMany();

    console.log('Deleting leases...');
    await prisma.lease.deleteMany();

    // Clear many-to-many relationships
    console.log('Clearing tenant favorites...');
    await prisma.$executeRawUnsafe('DELETE FROM "_TenantFavorites"');

    console.log('Clearing tenant properties...');
    await prisma.$executeRawUnsafe('DELETE FROM "_TenantProperties"');

    console.log('Deleting properties...');
    await prisma.property.deleteMany();

    console.log('Deleting locations...');
    await prisma.location.deleteMany();

    console.log('Deleting tenants...');
    await prisma.tenant.deleteMany();

    console.log('Deleting managers...');
    await prisma.manager.deleteMany();

    console.log('Database reset completed successfully!');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetDatabase()
  .then(() => {
    console.log('Reset process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error during reset:', error);
    process.exit(1);
  });

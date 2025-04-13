import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function addCleaningFeeColumn() {
  try {
    console.log('Starting migration to add cleaning_fee column...');
    
    // Execute the SQL directly through Prisma
    const result = await prisma.$executeRaw`
      ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "cleaningFee" FLOAT DEFAULT 0;
    `;
    
    console.log('Migration complete:', result);
    console.log('Column "cleaningFee" added to "Property" table');
    
  } catch (error) {
    console.error('Error executing migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addCleaningFeeColumn()
  .then(() => console.log('Finished'))
  .catch(console.error); 
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database cleanup...');

  // First get all model names from Prisma
  const modelNames = Object.keys(prisma).filter(
    (key) => !key.startsWith('_') && key !== 'on' && key !== 'connect'
  );

  console.log(`Found models: ${modelNames.join(', ')}`);

  // Delete in reverse order to handle foreign key constraints
  // This approach assumes a certain deletion order to avoid foreign key constraint issues
  const deletionOrder = [
    'payment',
    'lease',
    'application',
    'property',
    'location',
    'tenant',
    'manager',
  ];

  // Alternative: If you want to confirm each table deletion
  for (const model of deletionOrder) {
    try {
      // Skip models that don't exist in Prisma
      if (!modelNames.includes(model)) {
        console.log(`Model ${model} not found, skipping...`);
        continue;
      }

      // @ts-ignore - Dynamic access to Prisma models
      const deleteCount = await prisma[model].deleteMany({});
      console.log(`Deleted ${deleteCount.count} records from ${model}`);
    } catch (error) {
      console.error(`Error deleting from ${model}:`, error);
    }
  }

  console.log('Database cleanup completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

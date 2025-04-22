import { PrismaClient, Prisma } from '@prisma/client';

// Add the SQL export
export const { sql } = Prisma;

// Create a singleton Prisma instance
let prisma: PrismaClient;

// Maximum retry count for database operations
const MAX_RETRIES = 3;
// Base delay in milliseconds (will be multiplied by retry attempt)
const BASE_RETRY_DELAY = 1000;

// Initialize Prisma with connection handling
export function getPrismaInstance(): PrismaClient {
  if (!prisma) {
    console.log('Initializing new Prisma client');
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  return prisma;
}

// Function to check if database is connected
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('Database connection test result:', result);
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Generic function to retry database operations with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Database operation'
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`${operationName}: Attempt ${attempt}/${MAX_RETRIES}`);
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Only retry if it's a connection error
      if (!error.message?.includes("Can't reach database server")) {
        console.error(
          `${operationName} failed with non-connection error:`,
          error
        );
        throw error;
      }

      console.warn(
        `${operationName} failed (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`
      );

      // Don't wait on the last attempt
      if (attempt < MAX_RETRIES) {
        // Exponential backoff
        const delay = BASE_RETRY_DELAY * attempt;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`${operationName} failed after ${MAX_RETRIES} attempts`);
  throw lastError;
}

// Helper to gracefully disconnect Prisma
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    console.log('Prisma client disconnected');
  }
}

// Initialize the client
prisma = getPrismaInstance();

export default prisma;

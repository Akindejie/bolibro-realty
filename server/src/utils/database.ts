import { PrismaClient, Prisma } from '@prisma/client';

// Add the SQL export
export const { sql } = Prisma;

// Create a singleton Prisma instance with custom connection handling
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
      // Adding datasources configuration with connection pooling settings
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
          // Add connection pool options to URL
          // This helps manage prepared statements better
        },
      },
    });

    // Add middleware to handle connection issues
    prisma.$use(async (params, next) => {
      let retries = 0;

      while (retries < 3) {
        try {
          return await next(params);
        } catch (error: any) {
          // If it's a prepared statement error, reconnect and retry
          if (
            error.message?.includes('prepared statement') &&
            (error.code === '42P05' || error.message.includes('already exists'))
          ) {
            console.log(
              `Handling prepared statement error, reconnecting... (attempt ${
                retries + 1
              })`
            );
            await prisma.$disconnect();
            // Add a small delay before reconnecting
            await new Promise((resolve) => setTimeout(resolve, 100));
            await prisma.$connect();
            retries++;
            // Continue to retry
          } else {
            // For other errors, just throw
            throw error;
          }
        }
      }

      // If we've exhausted retries, throw the last error
      throw new Error(
        `Failed after ${retries} retries: prepared statement error`
      );
    });
  }
  return prisma;
}

// Function to check if database is connected
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    console.log('Testing database connection...');
    // Use a simple query without prepared statements
    await prisma.$executeRaw`SELECT 1`;
    console.log('Database connection successful');
    return true;
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

      // Handle prepared statement errors
      if (
        error.message?.includes('prepared statement') &&
        (error.code === '42P05' || error.message.includes('already exists'))
      ) {
        console.log('Handling prepared statement error in retry logic');
        await prisma.$disconnect();
        await prisma.$connect();
      }

      // Only retry if it's a connection error or a prepared statement error
      if (
        !error.message?.includes("Can't reach database server") &&
        !error.message?.includes('prepared statement')
      ) {
        console.error(
          `${operationName} failed with non-retryable error:`,
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

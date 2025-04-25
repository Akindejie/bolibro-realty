import { PrismaClient, Prisma } from '@prisma/client';

// Add the SQL export
export const { sql } = Prisma;

// Maximum retry count for database operations
const MAX_RETRIES = 3;
// Base delay in milliseconds (will be multiplied by retry attempt)
const BASE_RETRY_DELAY = 1000;

// Global declarations to satisfy singleton pattern
declare global {
  // Use a namespace to avoid collisions
  var _prismaClientSingleton: {
    client: PrismaClient | undefined;
    isConnecting: boolean;
  };
}

// Create or get the global singleton object
if (!global._prismaClientSingleton) {
  global._prismaClientSingleton = {
    client: undefined,
    isConnecting: false,
  };
}

// Initialize Prisma with connection handling - proper singleton implementation
// that survives nodemon restarts
export function getPrismaInstance(): PrismaClient {
  // Return existing client if already initialized
  if (global._prismaClientSingleton.client) {
    return global._prismaClientSingleton.client;
  }

  // If another initialization is in progress, wait a bit and try again
  if (global._prismaClientSingleton.isConnecting) {
    console.log('Another Prisma client initialization in progress, waiting...');
    // In a real app, we would implement a proper wait mechanism
    // For now, just create a new client
  }

  try {
    // Mark as connecting
    global._prismaClientSingleton.isConnecting = true;
    console.log('Initializing new Prisma client');

    // Parse the DATABASE_URL to add connection pool params if not present
    let dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl && !dbUrl.includes('connection_limit')) {
      // Add connection pooling parameters with conservative settings
      const separator = dbUrl.includes('?') ? '&' : '?';
      dbUrl = `${dbUrl}${separator}connection_limit=3&statement_cache_size=0&pool_timeout=20`;
    }

    // Create the client with statement_cache_size=0 to prevent prepared statement issues
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    // Store the client in the global object
    global._prismaClientSingleton.client = prisma;

    return prisma;
  } finally {
    // Mark as no longer connecting
    global._prismaClientSingleton.isConnecting = false;
  }
}

// Function to check if database is connected
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    console.log('Testing database connection...');
    const client = getPrismaInstance();

    // Use a connection test that avoids prepared statements entirely
    try {
      // This query uses simple parameters that don't create prepared statements
      const uniqueId = `c${Date.now()}`;
      const result = await client.$queryRawUnsafe(
        `SELECT '${uniqueId}' as connected`
      );
      console.log('Database connection successful');
      return true;
    } catch (error: any) {
      if (error.message?.includes('prepared statement')) {
        console.error(
          'Prepared statement error on connection test:',
          error.message
        );

        // Try reconnecting
        try {
          await disconnectPrisma();
          // Delay to let the connection fully close
          await new Promise((r) => setTimeout(r, 1000));

          // Force a new client creation
          global._prismaClientSingleton.client = undefined;

          // Get a fresh instance
          const freshClient = getPrismaInstance();
          await freshClient.$connect();

          // Try a different query approach
          const models = Object.keys(freshClient)
            .filter((k) => !k.startsWith('$') && !k.startsWith('_'))
            .filter(
              (k) => typeof (freshClient as any)[k].findFirst === 'function'
            );

          if (models.length > 0) {
            // Use the first model to test connection
            await (freshClient as any)[models[0]].findFirst({
              take: 1,
              select: { id: true },
            });
            console.log(
              `Database reconnected successfully (using ${models[0]})`
            );
            return true;
          }

          return false;
        } catch (reconnectError) {
          console.error('Reconnection failed:', reconnectError);
          return false;
        }
      }

      console.error('Database connection test failed:', error);
      return false;
    }
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
  const client = getPrismaInstance();

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

        try {
          await client.$disconnect();
          // Add a longer delay
          await new Promise((resolve) => setTimeout(resolve, 500));
          await client.$connect();
        } catch (reconnectError) {
          console.error('Error reconnecting:', reconnectError);
        }
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
  if (global._prismaClientSingleton.client) {
    try {
      await global._prismaClientSingleton.client.$disconnect();
      console.log('Prisma client disconnected');
    } catch (error) {
      console.error('Error disconnecting Prisma client:', error);
    }
  }
}

// Export the Prisma instance
export default getPrismaInstance();

import { PrismaClient, Prisma } from '@prisma/client';

// Create a singleton instance of the PrismaClient
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Export SQL tag for use in raw queries
const { sql, join, empty } = Prisma;

export { prisma, sql, join, empty };
export default prisma;

// Around line 315, adjust the import or usage
// Assuming you have: import { PrismaClient, Prisma } from '@prisma/client';
// Change Prisma.Sql to Prisma.sql or import sql directly if needed.

// Example if using Prisma.sql directly:
// ...
// const someQuery = Prisma.sql`SELECT * FROM ...`; // Use lowercase 'sql'
// ...

// Or better, import sql from database.ts if it's exported there:
import prisma, { sql } from '../utils/database'; // Assuming sql is exported from database.ts

// ... later in the code around line 315
// const someQuery = sql`SELECT * FROM ...`; // Use the imported sql directly
// ... existing code ...
-- Rename columns in Tenant table
ALTER TABLE "Tenant" RENAME COLUMN "cognitoId" TO "supabaseId";

-- Rename columns in Manager table
ALTER TABLE "Manager" RENAME COLUMN "cognitoId" TO "supabaseId";

-- Rename columns in Property table
ALTER TABLE "Property" RENAME COLUMN "managerCognitoId" TO "managerId";

-- Rename columns in Application table
ALTER TABLE "Application" RENAME COLUMN "tenantCognitoId" TO "tenantId";

-- Rename columns in Lease table
ALTER TABLE "Lease" RENAME COLUMN "tenantCognitoId" TO "tenantId";

-- Fix relationship names for better clarity
UPDATE "_prisma_migrations" SET "checksum" = 'e328c8f959ea5b9be2736594116262b10ae6fff60bc82a3e05c1a008478317c7' WHERE "migration_name" = 'rename_id_fields'; 
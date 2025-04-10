-- SQL script to clear all data from tables while preserving the schema
-- Execute this directly in the Supabase SQL editor

-- Disable triggers temporarily to avoid foreign key issues
SET session_replication_role = 'replica';

-- Clear junction tables for many-to-many relationships
TRUNCATE TABLE "_TenantFavorites" CASCADE;
TRUNCATE TABLE "_TenantProperties" CASCADE;

-- Clear tables in order (child tables first to avoid foreign key issues)
TRUNCATE TABLE "Payment" CASCADE;
TRUNCATE TABLE "Application" CASCADE;
TRUNCATE TABLE "Lease" CASCADE;
TRUNCATE TABLE "Property" CASCADE;
TRUNCATE TABLE "Location" CASCADE;
TRUNCATE TABLE "Tenant" CASCADE;
TRUNCATE TABLE "Manager" CASCADE;

-- Reset all sequences
ALTER SEQUENCE "Payment_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Application_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Lease_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Property_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Location_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Tenant_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Manager_id_seq" RESTART WITH 1;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify empty tables
SELECT 'Payment' as table_name, COUNT(*) as row_count FROM "Payment"
UNION ALL
SELECT 'Application', COUNT(*) FROM "Application"
UNION ALL
SELECT 'Lease', COUNT(*) FROM "Lease"
UNION ALL
SELECT 'Property', COUNT(*) FROM "Property"
UNION ALL
SELECT 'Location', COUNT(*) FROM "Location"
UNION ALL
SELECT 'Tenant', COUNT(*) FROM "Tenant"
UNION ALL
SELECT 'Manager', COUNT(*) FROM "Manager"
UNION ALL
SELECT '_TenantFavorites', COUNT(*) FROM "_TenantFavorites"
UNION ALL
SELECT '_TenantProperties', COUNT(*) FROM "_TenantProperties"; 
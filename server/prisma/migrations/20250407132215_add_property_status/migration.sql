-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('Available', 'Rented', 'UnderMaintenance', 'Inactive');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "status" "PropertyStatus" NOT NULL DEFAULT 'Available';

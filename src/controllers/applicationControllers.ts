import { Request, Response } from 'express';
import { handlePrismaError } from '../utils/prismaErrorHandler';
import { asyncHandler } from '../utils/asyncHandler';
import prisma, { withRetry } from '../utils/database';
import { Property, Application } from '@prisma/client'; // Import necessary types

export const getApplications = asyncHandler(
  async (
    req: Request<{}, {}, {}, { userId?: string; userType?: string }>,
    res: Response
  ) => {
    // ... existing code ...
        const properties = await prisma.property.findMany({
          where: {
            managerId: String(userId),
          },
          select: { id: true },
        });
        const propertyIds = properties.map((p: Property) => p.id); // Add type 'Property' to 'p' (around line 22)
        whereClause = { propertyId: { in: propertyIds } };
    // ... existing code ...
    // Map the applications to a more client-friendly structure
    const mappedApplications = applications.map((app: Application & { property: Property & { location: any, manager: any }, tenant: any, lease: any }) => ({ // Add type 'Application' and related includes to 'app' (around line 47)
      id: app.id,
      applicationDate: app.applicationDate,
      status: app.status,
    // ... existing code ...
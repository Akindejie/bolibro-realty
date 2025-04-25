import { Request, Response, NextFunction } from 'express';
import { handlePrismaError } from '../utils/prismaErrorHandler';
import { asyncHandler } from '../utils/asyncHandler';
import prisma, { withRetry } from '../utils/database';

// Define enums locally if they're not available from Prisma
enum ApplicationStatus {
  Pending = 'Pending',
  Denied = 'Denied',
  Approved = 'Approved',
}

enum PropertyStatus {
  Available = 'Available',
  Rented = 'Rented',
  UnderMaintenance = 'UnderMaintenance',
  Inactive = 'Inactive',
}

// Define Lease interface since we're not importing from @prisma/client
interface Lease {
  id: number;
  propertyId: number;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  rent: number;
  deposit: number;
  property?: any;
  tenant?: any;
}

export const getApplications = asyncHandler(
  async (
    req: Request<{}, {}, {}, { userId?: string; userType?: string }>,
    res: Response
  ) => {
    const { userId, userType } = req.query;
    const whereClause: any = {}; // Change from Prisma.ApplicationWhereInput to any

    if (userId && userType) {
      if (userType === 'manager') {
        const properties = await prisma.property.findMany({
          where: {
            managerId: userId,
          },
          select: { id: true },
        });
        const propertyIds = properties.map((p: any) => p.id); // Change from Prisma.Property to any
        whereClause.propertyId = { in: propertyIds };
      } else if (userType === 'tenant') {
        whereClause.tenantId = userId;
      }
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        property: {
          include: {
            location: true,
            manager: true,
          },
        },
        tenant: true,
        lease: true,
      },
      orderBy: {
        applicationDate: 'desc',
      },
    });

    const mappedApplications = applications.map((app: any) => ({
      // Change from Prisma.Application to any
      id: app.id,
      applicationDate: app.applicationDate,
      status: app.status,
      property: {
        id: app.property.id,
        name: app.property.name,
        location: app.property.location,
        pricePerMonth: app.property.pricePerMonth,
        beds: app.property.beds,
        baths: app.property.baths,
        photoUrls: app.property.photoUrls,
        manager: app.property.manager
          ? {
              id: app.property.manager.id,
              name: app.property.manager.name,
              email: app.property.manager.email,
              phoneNumber: app.property.manager.phoneNumber,
              supabaseId: app.property.manager.supabaseId,
            }
          : null,
      },
      tenant: {
        id: app.tenant.id,
        name: app.tenant.name,
        email: app.tenant.email,
        phoneNumber: app.tenant.phoneNumber,
        supabaseId: app.tenantId,
      },
      contactInfo: {
        name: app.name,
        email: app.email,
        phoneNumber: app.phoneNumber,
        message: app.message,
      },
      lease: app.lease,
    }));

    res.status(200).json(mappedApplications);
  }
);

export const createApplication = asyncHandler(
  async (req: Request, res: Response) => {
    console.log(
      'Application creation request body:',
      JSON.stringify(req.body, null, 2)
    );

    const {
      propertyId,
      tenantId,
      name,
      email,
      phoneNumber,
      occupation,
      annualIncome,
      message,
      applicationDate,
      status,
    } = req.body;

    console.log('Extracted fields:', {
      propertyId: typeof propertyId,
      propertyIdValue: propertyId,
      tenantId,
      name,
      email,
      phoneNumber,
      occupation,
      annualIncome,
    });

    // Validate required fields
    const missingFields = [];
    if (!propertyId) missingFields.push('propertyId');
    if (!tenantId) missingFields.push('tenantId');
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!phoneNumber) missingFields.push('phoneNumber');
    // Do not require occupation and annualIncome as they're optional in the schema
    // if (!occupation) missingFields.push('occupation');
    // if (annualIncome === undefined || annualIncome === null)
    //   missingFields.push('annualIncome');

    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(
        ', '
      )}`;
      console.error(errorMessage);
      return res.status(400).json({
        message: errorMessage,
      });
    }

    // Ensure propertyId is a valid number
    const parsedPropertyId =
      typeof propertyId === 'number' ? propertyId : parseInt(propertyId, 10);
    if (isNaN(parsedPropertyId)) {
      const errorMessage = `Invalid propertyId format: ${propertyId} (type: ${typeof propertyId})`;
      console.error(errorMessage);
      return res.status(400).json({ message: errorMessage });
    }

    console.log('Valid propertyId parsed:', parsedPropertyId);

    // Validate annualIncome is a valid number if provided
    let parsedAnnualIncome = undefined;
    if (annualIncome !== undefined && annualIncome !== null) {
      parsedAnnualIncome =
        typeof annualIncome === 'number'
          ? annualIncome
          : parseFloat(annualIncome);

      if (isNaN(parsedAnnualIncome)) {
        const errorMessage = `Invalid annualIncome format: ${annualIncome} (type: ${typeof annualIncome})`;
        console.error(errorMessage);
        return res.status(400).json({ message: errorMessage });
      }
    }

    try {
      // Check if property exists
      const property = await prisma.property.findUnique({
        where: { id: parsedPropertyId },
      });

      if (!property) {
        const errorMessage = `Property not found with ID: ${parsedPropertyId}`;
        console.error(errorMessage);
        return res.status(404).json({ message: errorMessage });
      }

      console.log('Property found:', property.id, property.name);

      // Check if tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { supabaseId: String(tenantId) },
      });

      if (!tenant) {
        const errorMessage = `Tenant not found with ID: ${tenantId}`;
        console.error(errorMessage);
        return res.status(404).json({ message: errorMessage });
      }

      console.log('Tenant found:', tenant.id, tenant.name);

      console.log('Creating application with data:', {
        applicationDate: applicationDate
          ? new Date(applicationDate)
          : new Date(),
        status: status || ApplicationStatus.Pending,
        propertyId: parsedPropertyId,
        tenantId,
        occupation,
        annualIncome: parsedAnnualIncome,
      });

      const newApplication = await prisma.application.create({
        data: {
          applicationDate: applicationDate
            ? new Date(applicationDate)
            : new Date(),
          status: status || ApplicationStatus.Pending,
          name,
          email,
          phoneNumber,
          occupation,
          annualIncome: parsedAnnualIncome,
          message,
          property: {
            connect: { id: parsedPropertyId },
          },
          tenant: {
            connect: { supabaseId: String(tenantId) },
          },
        },
        include: {
          property: {
            include: {
              location: true,
            },
          },
        },
      });

      console.log('Application created successfully:', newApplication.id);
      res.status(201).json(newApplication);
    } catch (error: any) {
      console.error('Application creation error details:', error);

      // Check for specific Prisma errors
      if (error.code === 'P2003') {
        return res.status(400).json({
          message:
            'Invalid reference: The propertyId or tenantId you provided does not exist',
          details: error.meta?.field_name || error.message,
        });
      }

      handlePrismaError(res, error, 'Failed to create application');
    }
  }
);

export const updateApplicationStatus = asyncHandler(
  async (
    req: Request, // Change to a standard Request type instead of a parameterized one
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.params;
    const { status } = req.body;
    const applicationId = parseInt(id, 10);

    if (isNaN(applicationId)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { property: true, lease: true },
      });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { status },
        include: {
          property: {
            include: {
              location: true,
            },
          },
          lease: true,
        },
      });

      let newLease: Lease | null = updatedApplication.lease;

      if (status === ApplicationStatus.Approved && !updatedApplication.lease) {
        newLease = await prisma.lease.create({
          data: {
            startDate: new Date(),
            endDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            ),
            rent: application.property.pricePerMonth,
            deposit: application.property.securityDeposit,
            propertyId: application.propertyId,
            tenantId: application.tenantId,
            application: {
              connect: { id: applicationId },
            },
          },
          include: {
            property: {
              include: {
                location: true,
              },
            },
            tenant: true,
          },
        });

        await prisma.property.update({
          where: { id: application.propertyId },
          data: { status: PropertyStatus.Rented },
        });
      }

      res.status(200).json({
        application: updatedApplication,
        lease: newLease,
      });
    } catch (error: any) {
      console.error('Application status update error:', error);
      handlePrismaError(res, error, 'Failed to update application status');
    }
  }
);

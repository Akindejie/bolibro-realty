import { Request, Response, NextFunction } from 'express';
import { handlePrismaError } from '../utils/prismaErrorHandler';
import { asyncHandler } from '../utils/asyncHandler';
import prisma, { withRetry } from '../utils/database';
import {
  Prisma,
  ApplicationStatus,
  PropertyStatus,
  Lease,
} from '@prisma/client';

export const getApplications = asyncHandler(
  async (
    req: Request<{}, {}, {}, { userId?: string; userType?: string }>,
    res: Response
  ) => {
    const { userId, userType } = req.query;
    const whereClause: Prisma.ApplicationWhereInput = {};

    if (userId && userType) {
      if (userType === 'manager') {
        const properties = await prisma.property.findMany({
          where: {
            managerId: userId,
          },
          select: { id: true },
        });
        const propertyIds = properties.map((p) => p.id);
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

    const mappedApplications = applications.map((app) => ({
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
  async (
    req: Request<
      {},
      {},
      {
        propertyId: number;
        tenantId: string;
        name: string;
        email: string;
        phoneNumber: string;
        occupation?: string;
        annualIncome?: number;
        message?: string;
        applicationDate: string;
        status: ApplicationStatus;
      }
    >,
    res: Response
  ) => {
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

    try {
      const newApplication = await prisma.application.create({
        data: {
          applicationDate: new Date(applicationDate),
          status,
          name,
          email,
          phoneNumber,
          occupation,
          annualIncome,
          message,
          property: {
            connect: { id: propertyId },
          },
          tenant: {
            connect: { supabaseId: tenantId },
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

      res.status(201).json(newApplication);
    } catch (error: any) {
      console.error('Application creation error:', error);
      handlePrismaError(res, error as any, 'Failed to create application');
    }
  }
);

export const updateApplicationStatus = asyncHandler(
  async (
    req: Request<{ id: string }, {}, { status: ApplicationStatus }>,
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
      handlePrismaError(
        res,
        error as any,
        'Failed to update application status'
      );
    }
  }
);

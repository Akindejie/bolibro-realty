import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handlePrismaError } from '../utils/prismaErrorHandler';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../lib/prisma';

export const getApplications = asyncHandler(
  async (
    req: Request<{}, {}, {}, { userId?: string; userType?: string }>,
    res: Response
  ) => {
    const { userId, userType } = req.query;
    let whereClause = {};

    if (userId && userType) {
      if (userType === 'manager') {
        const properties = await prisma.property.findMany({
          where: {
            managerId: String(userId),
          },
          select: { id: true },
        });
        const propertyIds = properties.map((p) => p.id);
        whereClause = { propertyId: { in: propertyIds } };
      } else if (userType === 'tenant') {
        whereClause = { tenantId: String(userId) };
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

    // Map the applications to a more client-friendly structure
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
        status: 'Pending' | 'Approved' | 'Denied';
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
    } catch (error) {
      console.error('Application creation error:', error);
      res.status(400).json({
        message: 'Failed to create application',
        error: (error as Error).message,
      });
    }
  }
);

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const applicationId = parseInt(id);

  if (isNaN(applicationId)) {
    res.status(400).json({ message: 'Invalid application ID' });
    return;
  }

  try {
    // First get the application to check the property ID
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { property: true, lease: true },
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    // Update the application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: status as any },
      include: {
        property: {
          include: {
            location: true,
          },
        },
        lease: true,
      },
    });

    let newLease = updatedApplication.lease;

    // If status is approved, create a lease
    if (status === 'Approved' && !updatedApplication.lease) {
      // Create a new lease
      newLease = await prisma.lease.create({
        data: {
          startDate: new Date(), // Set appropriate start date
          endDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          ), // 1 year lease
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

      // Update the property status to 'Rented'
      await prisma.property.update({
        where: { id: application.propertyId },
        data: { status: 'Rented' },
      });
    }

    res.status(200).json({
      application: updatedApplication,
      lease: newLease,
    });
  } catch (error) {
    console.error('Application status update error:', error);
    res.status(400).json({
      message: 'Failed to update application status',
      error: (error as Error).message,
    });
  }
});

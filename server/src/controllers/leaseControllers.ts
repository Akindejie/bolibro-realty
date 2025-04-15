import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handlePrismaError } from '../utils/prismaErrorHandler';
import { uploadLeaseDocument as uploadLeaseDocumentToStorage } from '../utils/fileUpload';

// Define AuthenticatedRequest interface inline to avoid import issues
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Define asyncHandler inline to avoid import issues
const asyncHandler = (
  fn: (req: AuthenticatedRequest, res: Response) => Promise<any>
) => {
  return (req: AuthenticatedRequest, res: Response) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      console.error('Error in async handler:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message,
      });
    });
  };
};

const prisma = new PrismaClient();

export const getLeases = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id: userId, role: userRole } = req.user || {};

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    try {
      let leases;

      if (userRole.toLowerCase() === 'manager') {
        // Get all properties for the manager
        const properties = await prisma.property.findMany({
          where: {
            managerId: userId,
          },
          select: {
            id: true,
          },
        });

        const propertyIds = properties.map((p) => p.id);

        // Get leases for these properties
        leases = await prisma.lease.findMany({
          where: {
            propertyId: {
              in: propertyIds,
            },
          },
          include: {
            property: {
              include: {
                location: true,
              },
            },
            tenant: true,
            payments: true,
          },
        });
      } else {
        // Get leases for tenant
        leases = await prisma.lease.findMany({
          where: {
            tenantId: userId,
          },
          include: {
            property: {
              include: {
                location: true,
              },
            },
            tenant: true,
            payments: true,
          },
        });
      }

      // Check if user has permission to access the lease
      for (const lease of leases) {
        const hasPermission =
          (userRole === 'manager' && lease.property.managerId === userId) ||
          (userRole === 'tenant' && lease.tenantId === userId);

        if (!hasPermission) {
          res
            .status(403)
            .json({ message: 'Unauthorized access to this lease' });
          return;
        }
      }

      res.status(200).json(leases);
    } catch (error) {
      console.error('Error fetching leases:', error);
      res.status(500).json({
        message: 'Failed to fetch leases',
        error: (error as Error).message,
      });
    }
  }
);

export const getLeasePayments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate the lease ID
    const leaseId = Number(id);
    if (isNaN(leaseId)) {
      res.status(400).json({ message: 'Invalid lease ID. Must be a number.' });
      return;
    }
    
    // Check if the lease exists
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: {
          select: {
            managerId: true
          }
        }
      }
    });

    if (!lease) {
      res.status(404).json({ message: 'Lease not found' });
      return;
    }

    // Verify authorization
    const userId = req.user?.id;
    const userRole = req.user?.role?.toLowerCase();
    
    if (!userId || !userRole) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Check if the user has permission to access this lease's payments
    const hasPermission = 
      (userRole === 'manager' && lease.property.managerId === userId) ||
      (userRole === 'tenant' && lease.tenantId === userId);

    if (!hasPermission) {
      res.status(403).json({ message: 'You do not have permission to access these payments' });
      return;
    }

    // Find all payments for this lease
    const payments = await prisma.payment.findMany({
      where: { leaseId: leaseId }
    });
    
    res.json(payments);
  } catch (error: any) {
    console.error('Error getting lease payments:', error);
    res.status(500).json({ 
      message: 'Error fetching lease payments', 
      error: error.message 
    });
  }
};

/**
 * Upload a document for a lease (agreement, addendum, etc)
 */
export const uploadLeaseDocument = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;
    const leaseId = Number(id);

    // Check if lease exists
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: { property: { select: { managerId: true } } },
    });

    if (!lease) {
      res.status(404).json({ message: 'Lease not found' });
      return;
    }

    // Check if user has permission (manager of the property or tenant of the lease)
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const isAuthorizedManager =
      userRole === 'manager' && lease.property.managerId === userId;
    const isAuthorizedTenant =
      userRole === 'tenant' && lease.tenantId === userId;

    if (!isAuthorizedManager && !isAuthorizedTenant) {
      res.status(403).json({
        message:
          'You do not have permission to upload documents for this lease',
      });
      return;
    }

    // Get the uploaded file from multer
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    if (!documentType) {
      res.status(400).json({ message: 'Document type is required' });
      return;
    }

    // Upload the file
    const documentUrl = await uploadLeaseDocumentToStorage(
      file,
      leaseId,
      documentType
    );

    if (!documentUrl) {
      res.status(500).json({ message: 'Failed to upload document' });
      return;
    }

    res.status(201).json({
      message: 'Document uploaded successfully',
      documentUrl: documentUrl,
    });
  } catch (error: any) {
    console.error('Error uploading lease document:', error);
    handlePrismaError(error, res, 'uploadLeaseDocument');
  }
};

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handlePrismaError } from '../utils/prismaErrorHandler';
import { uploadLeaseDocument as uploadLeaseDocumentToStorage } from '../utils/fileUpload';

const prisma = new PrismaClient();

export const getLeases = async (req: Request, res: Response): Promise<void> => {
  try {
    const leases = await prisma.lease.findMany({
      include: {
        tenant: true,
        property: true,
      },
    });
    res.json(leases);
  } catch (error: any) {
    handlePrismaError(error, res, 'getLeases');
  }
};

export const getLeasePayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const payments = await prisma.payment.findMany({
      where: { leaseId: Number(id) },
    });
    res.json(payments);
  } catch (error: any) {
    handlePrismaError(error, res, 'getLeases');
  }
};

/**
 * Upload a document for a lease (agreement, addendum, etc)
 */
export const uploadLeaseDocument = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;
    const leaseId = Number(id);

    // Check if lease exists
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: { property: { select: { managerCognitoId: true } } },
    });

    if (!lease) {
      res.status(404).json({ message: 'Lease not found' });
      return;
    }

    // Check if user has permission (manager of the property or tenant of the lease)
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const isAuthorizedManager =
      userRole === 'manager' && lease.property.managerCognitoId === userId;
    const isAuthorizedTenant =
      userRole === 'tenant' && lease.tenantCognitoId === userId;

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

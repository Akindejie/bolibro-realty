import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { handleUpload } from '../middleware/uploadMiddleware';
import {
  createProperty,
  deleteProperty,
  getProperties,
  getProperty,
  updateProperty,
  updatePropertyStatus,
  updateBulkPropertyStatus,
  uploadPropertyImage,
  getPropertyLeases,
  getPropertyPayments,
  updatePropertyImages,
} from '../controllers/propertyControllers';

const router = express.Router();

// Public routes that don't require authentication
router.get('/', getProperties);
router.get('/:id', getProperty);

// Protected routes - only managers can access
router.post(
  '/',
  authMiddleware(['manager']),
  handleUpload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'images', maxCount: 10 },
  ]),
  createProperty
);
router.patch(
  '/:id',
  authMiddleware(['manager']),
  handleUpload.array('photos'),
  updateProperty
);
router.delete('/:id', authMiddleware(['manager']), deleteProperty);

// Status routes
router.patch('/:id/status', authMiddleware(['manager']), updatePropertyStatus);
router.post(
  '/bulk-status-update',
  authMiddleware(['manager']),
  updateBulkPropertyStatus
);

// Image management routes
router.post(
  '/:id/images',
  authMiddleware(['manager']),
  handleUpload.array('images'),
  uploadPropertyImage
);

// Add the missing PUT route for updating property images
router.put('/:id/images', authMiddleware(['manager']), updatePropertyImages);

// Lease routes
router.get(
  '/:id/leases',
  authMiddleware(['manager', 'tenant']),
  getPropertyLeases
);
router.get(
  '/:id/payments',
  authMiddleware(['manager', 'tenant']),
  getPropertyPayments
);

export default router;

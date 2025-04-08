import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { handleUpload } from '../middleware/uploadMiddleware';
import {
  createProperty,
  deleteProperty,
  getProperties,
  getProperty,
  getPropertyLeases,
  updateProperty,
  updatePropertyStatus,
  updateBulkPropertyStatus,
  uploadPropertyImages,
  updatePropertyImages,
} from '../controllers/propertyControllers';

const router = express.Router();

// Public routes that don't require authentication
router.get('/', getProperties);
router.get('/:id', getProperty);
router.get('/:id/leases', getPropertyLeases);

// Protected routes - only managers can access
router.post(
  '/',
  authMiddleware(['manager']),
  handleUpload.array('photos'),
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
  uploadPropertyImages
);
router.put('/:id/images', authMiddleware(['manager']), updatePropertyImages);

export default router;

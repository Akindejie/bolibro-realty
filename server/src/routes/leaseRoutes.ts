import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getLeasePayments,
  getLeases,
  uploadLeaseDocument,
} from '../controllers/leaseControllers';
import { handleDocumentUpload } from '../middleware/uploadMiddleware';

const router = express.Router();

router.get('/', authMiddleware(['manager', 'tenant']), getLeases);
router.get(
  '/:id/payments',
  authMiddleware(['manager', 'tenant']),
  getLeasePayments
);

// Route for uploading lease documents
router.post(
  '/:id/documents',
  authMiddleware(['manager', 'tenant']),
  handleDocumentUpload.single('document'),
  uploadLeaseDocument
);

export default router;

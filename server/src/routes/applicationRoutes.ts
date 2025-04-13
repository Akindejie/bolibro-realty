import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createApplication,
  getApplications,
  updateApplicationStatus,
} from '../controllers/applicationControllers';

const router = express.Router();

router.post('/', authMiddleware(['tenant']), createApplication);
router.patch(
  '/:id/status',
  authMiddleware(['manager']),
  updateApplicationStatus
);
router.get('/', authMiddleware(['manager', 'tenant']), getApplications);

export default router;

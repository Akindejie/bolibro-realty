import express from 'express';
import {
  getManager,
  createManager,
  updateManager,
  getManagerProperties,
  getManagerProfile,
} from '../controllers/managerControllers';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthenticatedRequest } from '../types/authenticatedRequest';

const router = express.Router();

// Public routes
router.post('/', createManager);

// Special 'me' route for the authenticated user
router.get('/me', authMiddleware(['manager']), getManagerProfile);

// Protected routes - require manager role
router.get('/:userId', authMiddleware(['manager']), getManager);
router.put('/:userId', authMiddleware(['manager']), updateManager);
router.get(
  '/:userId/properties',
  authMiddleware(['manager']),
  getManagerProperties
);

export default router;

import express from 'express';
import {
  getTenant,
  createTenant,
  updateTenant,
  getCurrentResidences,
  addFavoriteProperty,
  removeFavoriteProperty,
  getTenantProfile,
} from '../controllers/tenantControllers';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/', createTenant);

// Special 'me' route for the authenticated user
router.get('/me', authMiddleware(['tenant']), getTenantProfile);

// Protected routes
router.get('/:userId', authMiddleware(['tenant', 'manager']), getTenant);
router.put('/:userId', authMiddleware(['tenant']), updateTenant);
router.get(
  '/:userId/current-residences',
  authMiddleware(['tenant']),
  getCurrentResidences
);
router.post(
  '/:userId/favorites/:propertyId',
  authMiddleware(['tenant']),
  addFavoriteProperty
);
router.delete(
  '/:userId/favorites/:propertyId',
  authMiddleware(['tenant']),
  removeFavoriteProperty
);

export default router;

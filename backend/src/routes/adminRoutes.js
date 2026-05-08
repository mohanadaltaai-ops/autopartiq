import { Router } from 'express';
import {
  dashboard,
  createSupplier,
  updateSupplier,
  disableSupplier,
  createAdminUser,
  listAdminUsers,
  updateAdminUser,
  disableAdminUser
} from '../controllers/adminController.js';
import { requireAuth, requireRole, requireFullAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { supplierSchema } from '../validators/schemas.js';

const router = Router();

router.get('/dashboard', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), dashboard);

router.get('/users', requireAuth, requireRole('SUPER_ADMIN'), listAdminUsers);
router.post('/users', requireAuth, requireRole('SUPER_ADMIN'), createAdminUser);
router.patch('/users/:id', requireAuth, requireRole('SUPER_ADMIN'), updateAdminUser);
router.delete('/users/:id', requireAuth, requireRole('SUPER_ADMIN'), disableAdminUser);

router.post(
  '/suppliers',
  requireAuth,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  requireFullAdmin,
  validateBody(supplierSchema),
  createSupplier
);

router.patch(
  '/suppliers/:id',
  requireAuth,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  requireFullAdmin,
  validateBody(supplierSchema),
  updateSupplier
);

router.delete(
  '/suppliers/:id',
  requireAuth,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  requireFullAdmin,
  disableSupplier
);

export default router;

import { Router } from 'express';
import { dashboard, createSupplier, updateSupplier, disableSupplier } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { supplierSchema } from '../validators/schemas.js';

const router = Router();
router.get('/dashboard', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), dashboard);
router.post('/suppliers', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), validateBody(supplierSchema), createSupplier);
router.patch('/suppliers/:id', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), validateBody(supplierSchema), updateSupplier);
router.delete('/suppliers/:id', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), disableSupplier);

export default router;

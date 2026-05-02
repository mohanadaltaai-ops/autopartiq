import { Router } from 'express';
import { dashboard, createSupplier, updateSupplier, disableSupplier } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/dashboard', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), dashboard);
router.post('/suppliers', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), createSupplier);
router.patch('/suppliers/:id', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), updateSupplier);
router.delete('/suppliers/:id', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), disableSupplier);

export default router;

import { Router } from 'express';
import { dashboard, createSupplier } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/dashboard', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), dashboard);
router.post('/suppliers', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), createSupplier);

export default router;

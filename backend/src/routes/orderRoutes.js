import { Router } from 'express';
import { myOrders, updateOrderStatus } from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/mine', requireAuth, myOrders);
router.patch('/:id/status', requireAuth, requireRole('SUPPLIER','ADMIN','SUPER_ADMIN'), updateOrderStatus);

export default router;

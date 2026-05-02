import { Router } from 'express';
import { myOrders, updateOrderStatus } from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { orderStatusSchema } from '../validators/schemas.js';

const router = Router();
router.get('/mine', requireAuth, myOrders);
router.patch('/:id/status', requireAuth, requireRole('SUPPLIER','ADMIN','SUPER_ADMIN'), validateBody(orderStatusSchema), updateOrderStatus);

export default router;

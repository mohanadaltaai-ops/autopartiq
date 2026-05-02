import { Router } from 'express';
import { myOrders, updateOrderStatus, updatePayment, updateDelivery } from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { orderStatusSchema, paymentUpdateSchema, deliveryAssignmentSchema } from '../validators/schemas.js';

const router = Router();
router.get('/mine', requireAuth, myOrders);
router.patch('/:id/status', requireAuth, requireRole('SUPPLIER','ADMIN','SUPER_ADMIN'), validateBody(orderStatusSchema), updateOrderStatus);
router.patch('/:id/payment', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), validateBody(paymentUpdateSchema), updatePayment);
router.patch('/:id/delivery', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), validateBody(deliveryAssignmentSchema), updateDelivery);

export default router;

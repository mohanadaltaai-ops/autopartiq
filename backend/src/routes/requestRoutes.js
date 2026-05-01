import { Router } from 'express';
import { createRequest, myRequests, cancelRequest, supplierLeads } from '../controllers/requestController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.post('/', requireAuth, requireRole('CUSTOMER'), createRequest);
router.get('/mine', requireAuth, requireRole('CUSTOMER'), myRequests);
router.patch('/:id/cancel', requireAuth, requireRole('CUSTOMER'), cancelRequest);
router.get('/supplier/leads', requireAuth, requireRole('SUPPLIER'), supplierLeads);

export default router;

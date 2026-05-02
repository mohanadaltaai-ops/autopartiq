import { Router } from 'express';
import { createRequest, myRequests, cancelRequest, supplierLeads } from '../controllers/requestController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { requestCreateSchema, requestCancelSchema } from '../validators/schemas.js';

const router = Router();
router.post('/', requireAuth, requireRole('CUSTOMER'), validateBody(requestCreateSchema), createRequest);
router.get('/mine', requireAuth, requireRole('CUSTOMER'), myRequests);
router.patch('/:id/cancel', requireAuth, requireRole('CUSTOMER'), validateBody(requestCancelSchema), cancelRequest);
router.get('/supplier/leads', requireAuth, requireRole('SUPPLIER'), supplierLeads);

export default router;

import { Router } from 'express';
import { createOffer, supplierOffers, cancelOffer, acceptOffer } from '../controllers/offerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { offerCreateSchema } from '../validators/schemas.js';

const router = Router();
router.get('/mine', requireAuth, requireRole('SUPPLIER'), supplierOffers);
router.post('/request/:requestId', requireAuth, requireRole('SUPPLIER'), validateBody(offerCreateSchema), createOffer);
router.patch('/:offerId/cancel', requireAuth, requireRole('SUPPLIER'), cancelOffer);
router.post('/:offerId/accept', requireAuth, requireRole('CUSTOMER'), acceptOffer);

export default router;

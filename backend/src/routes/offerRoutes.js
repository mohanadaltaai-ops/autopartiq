import { Router } from 'express';
import { createOffer, acceptOffer } from '../controllers/offerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.post('/request/:requestId', requireAuth, requireRole('SUPPLIER'), createOffer);
router.post('/:offerId/accept', requireAuth, requireRole('CUSTOMER'), acceptOffer);

export default router;

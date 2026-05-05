import { Router } from 'express';
import {
  adminPayouts,
  adminPayoutSummary,
  markPayoutPaid,
  cancelPayout,
  supplierPayouts,
  supplierPayoutSummary
} from '../controllers/payoutController.js';
import { requireAuth, requireRole, requireFullAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/admin', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), requireFullAdmin, adminPayouts);
router.get('/admin/summary', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), requireFullAdmin, adminPayoutSummary);
router.patch('/admin/:id/mark-paid', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), requireFullAdmin, markPayoutPaid);
router.patch('/admin/:id/cancel', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), requireFullAdmin, cancelPayout);

router.get('/supplier', requireAuth, requireRole('SUPPLIER'), supplierPayouts);
router.get('/supplier/summary', requireAuth, requireRole('SUPPLIER'), supplierPayoutSummary);

export default router;

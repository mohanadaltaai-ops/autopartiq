import { Router } from 'express';
import { auditLogs } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), auditLogs);

export default router;

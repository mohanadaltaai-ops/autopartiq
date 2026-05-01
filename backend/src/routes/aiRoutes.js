import { Router } from 'express';
import { identifyPart } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/identify-part', requireAuth, identifyPart);

export default router;

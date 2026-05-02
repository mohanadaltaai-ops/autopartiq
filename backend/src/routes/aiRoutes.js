import { Router } from 'express';
import { identifyPart } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { aiIdentifySchema } from '../validators/schemas.js';

const router = Router();
router.post('/identify-part', requireAuth, validateBody(aiIdentifySchema), identifyPart);

export default router;

import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema } from '../validators/schemas.js';

const router = Router();
router.post('/login', validateBody(loginSchema), login);
router.get('/me', requireAuth, me);

export default router;

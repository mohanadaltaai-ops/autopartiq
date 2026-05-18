import { Router } from 'express';
import { login, requestLoginOtp, supabaseMagicLogin, superAdminLogin, enrollSuperAdmin, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, requestOtpSchema } from '../validators/schemas.js';

const router = Router();
router.post('/request-otp', validateBody(requestOtpSchema), requestLoginOtp);
router.post('/login', validateBody(loginSchema), login);
router.post('/supabase-login', supabaseMagicLogin);
router.post('/super-admin/login', superAdminLogin);
router.post('/super-admin/enroll', requireAuth, enrollSuperAdmin);
router.get('/me', requireAuth, me);

export default router;

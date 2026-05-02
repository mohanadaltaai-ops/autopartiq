import { Router } from 'express';
import { myNotifications, markNotificationsRead } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/mine', requireAuth, myNotifications);
router.patch('/read', requireAuth, markNotificationsRead);

export default router;

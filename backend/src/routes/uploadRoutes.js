import { Router } from 'express';
import { createUploadPlaceholder } from '../controllers/uploadController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/placeholder', requireAuth, createUploadPlaceholder);

export default router;

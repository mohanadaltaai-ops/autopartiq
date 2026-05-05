import { Router } from 'express';
import { createUploadPlaceholder, uploadImage } from '../controllers/uploadController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/placeholder', requireAuth, createUploadPlaceholder);
router.post('/image', requireAuth, uploadImage);

export default router;

import { Router } from 'express';
import { mySavedVehicles, saveVehicle, deleteSavedVehicle } from '../controllers/vehicleController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/mine', requireAuth, requireRole('CUSTOMER'), mySavedVehicles);
router.post('/', requireAuth, requireRole('CUSTOMER'), saveVehicle);
router.delete('/:id', requireAuth, requireRole('CUSTOMER'), deleteSavedVehicle);

export default router;

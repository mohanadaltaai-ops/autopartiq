import { Router } from 'express';
import { mySavedVehicles, saveVehicle, deleteSavedVehicle, setDefaultSavedVehicle } from '../controllers/vehicleController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/mine', requireAuth, requireRole('CUSTOMER'), mySavedVehicles);
router.post('/', requireAuth, requireRole('CUSTOMER'), saveVehicle);
router.patch('/:id/default', requireAuth, requireRole('CUSTOMER'), setDefaultSavedVehicle);
router.delete('/:id', requireAuth, requireRole('CUSTOMER'), deleteSavedVehicle);

export default router;

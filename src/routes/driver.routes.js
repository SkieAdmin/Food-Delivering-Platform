import express from 'express';
import { body } from 'express-validator';
import { isAuthenticated, hasRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  showSetup,
  setupDriver,
  updateAvailability,
  acceptOrder,
  completeDelivery
} from '../controllers/driver.controller.js';

const router = express.Router();

// Driver setup
router.get('/setup', isAuthenticated, hasRole('DRIVER'), showSetup);

router.post(
  '/setup',
  isAuthenticated,
  hasRole('DRIVER'),
  [
    body('vehicleType').trim().notEmpty().withMessage('Vehicle type is required'),
    body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
    body('currentCity').trim().notEmpty().withMessage('Operating city is required')
  ],
  validate,
  setupDriver
);

// Driver availability
router.post('/availability', isAuthenticated, hasRole('DRIVER'), updateAvailability);

// Order management
router.post('/accept-order', isAuthenticated, hasRole('DRIVER'), acceptOrder);
router.post('/complete-delivery', isAuthenticated, hasRole('DRIVER'), completeDelivery);

export default router;

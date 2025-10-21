import express from 'express';
import { body } from 'express-validator';
import { isAuthenticated, hasRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { showSetup, setupRestaurant } from '../controllers/restaurant.controller.js';

const router = express.Router();

router.get('/setup', isAuthenticated, hasRole('RESTAURANT'), showSetup);

router.post(
  '/setup',
  isAuthenticated,
  hasRole('RESTAURANT'),
  [
    body('name').trim().notEmpty().withMessage('Restaurant name is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('cuisine').trim().notEmpty().withMessage('Cuisine is required')
  ],
  validate,
  setupRestaurant
);

export default router;


import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { isGuest } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';

const router = express.Router();

// Register routes
router.get('/register', isGuest, authController.showRegister);
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').matches(/^\+[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number with country code')
  ],
  validate,
  authController.register
);

// OTP verification routes
router.get('/verify-otp', authController.showVerifyOTP);
router.post('/verify-otp', authController.verifyOTP);

// Login routes
router.get('/login', isGuest, authController.showLogin);
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  authController.login
);

// Logout route
router.get('/logout', authController.logout);

export default router;

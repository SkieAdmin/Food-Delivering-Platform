import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', isAuthenticated, dashboardController.showDashboard);

export default router;

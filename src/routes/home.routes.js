import express from 'express';
import * as homeController from '../controllers/home.controller.js';

const router = express.Router();

router.get('/', homeController.showHomepage);

export default router;

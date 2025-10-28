import express from 'express';
import * as restaurantController from '../controllers/restaurant.controller.js';

const router = express.Router();

router.get('/', restaurantController.listRestaurants);
router.get('/api/menu-items', restaurantController.getMenuItemsByIds);
router.get('/:id', restaurantController.viewRestaurant);

export default router;

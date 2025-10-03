import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/checkout', isAuthenticated, orderController.showCheckout);
router.post('/create', isAuthenticated, orderController.createOrder);
router.get('/:id', isAuthenticated, orderController.viewOrder);
router.get('/', isAuthenticated, orderController.listOrders);
router.post('/update-status', isAuthenticated, orderController.updateOrderStatus);

export default router;

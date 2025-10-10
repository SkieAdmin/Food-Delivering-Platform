import express from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  patchOrder,
  deleteOrder,
  updateOrderStatus,
  testConnection
} from '../controllers/order-processor.controller.js';

const router = express.Router();

/**
 * Order Processor Routes
 * External MockAPI integration for order processing
 *
 * Base Path: /api/order-processor
 */

// ===========================
// TEST ROUTE
// ===========================

/**
 * @route   GET /api/order-processor/test
 * @desc    Test MockAPI connection
 * @access  Public
 */
router.get('/test', testConnection);

// ===========================
// CRUD OPERATIONS
// ===========================

/**
 * @route   GET /api/order-processor
 * @desc    Get all orders from MockAPI
 * @access  Public
 * @returns {Array} List of all orders
 */
router.get('/', getAllOrders);

/**
 * @route   GET /api/order-processor/:id
 * @desc    Get a single order by ID
 * @access  Public
 * @params  id - Order ID (required)
 * @returns {Object} Order object
 */
router.get('/:id', getOrderById);

/**
 * @route   POST /api/order-processor
 * @desc    Create a new order in MockAPI
 * @access  Public
 * @body    {Object} Order data
 * @returns {Object} Created order
 *
 * Required fields:
 * - customerName (string)
 * - restaurantName (string)
 * - totalAmount (number)
 * - deliveryAddress (string)
 *
 * Optional fields:
 * - orderNumber (string) - auto-generated if not provided
 * - customerId (number)
 * - restaurantId (number)
 * - items (array)
 * - deliveryFee (number)
 * - status (string) - defaults to 'PENDING'
 * - paymentMethod (string)
 * - paymentStatus (string)
 * - notes (string)
 */
router.post('/', createOrder);

/**
 * @route   PUT /api/order-processor/:id
 * @desc    Update an entire order (full replacement)
 * @access  Public
 * @params  id - Order ID (required)
 * @body    {Object} Complete order data
 * @returns {Object} Updated order
 */
router.put('/:id', updateOrder);

/**
 * @route   PATCH /api/order-processor/:id
 * @desc    Partially update an order
 * @access  Public
 * @params  id - Order ID (required)
 * @body    {Object} Partial order data
 * @returns {Object} Updated order
 */
router.patch('/:id', patchOrder);

/**
 * @route   DELETE /api/order-processor/:id
 * @desc    Delete an order from MockAPI
 * @access  Public
 * @params  id - Order ID (required)
 * @returns {Object} Deletion confirmation
 */
router.delete('/:id', deleteOrder);

// ===========================
// CONVENIENCE ROUTES
// ===========================

/**
 * @route   PATCH /api/order-processor/:id/status
 * @desc    Update order status (convenience endpoint)
 * @access  Public
 * @params  id - Order ID (required)
 * @body    { status: string }
 * @returns {Object} Updated order
 *
 * Valid statuses:
 * - PENDING
 * - CONFIRMED
 * - PREPARING
 * - READY
 * - OUT_FOR_DELIVERY
 * - DELIVERED
 * - CANCELLED
 */
router.patch('/:id/status', updateOrderStatus);

export default router;

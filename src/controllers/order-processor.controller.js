import mockAPIService from '../services/mockapi.service.js';

/**
 * Order Processor Controller
 * Handles API requests and delegates to MockAPI service
 *
 * Routes:
 * - GET    /api/order-processor         → Get all orders
 * - GET    /api/order-processor/:id     → Get order by ID
 * - POST   /api/order-processor         → Create new order
 * - PUT    /api/order-processor/:id     → Update order
 * - PATCH  /api/order-processor/:id     → Patch order (partial update)
 * - DELETE /api/order-processor/:id     → Delete order
 * - PATCH  /api/order-processor/:id/status → Update order status
 */

/**
 * GET /api/order-processor
 * Fetch all orders from MockAPI
 */
export const getAllOrders = async (req, res) => {
  try {
    console.log('[Controller] GET /api/order-processor - Fetching all orders');

    const result = await mockAPIService.getAllOrders();

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Orders fetched successfully',
        count: result.count,
        data: result.data
      });
    }

    // Handle error from MockAPI service
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders from MockAPI',
      error: result.error
    });

  } catch (error) {
    console.error('[Controller] Error in getAllOrders:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * GET /api/order-processor/:id
 * Fetch a single order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Controller] GET /api/order-processor/${id} - Fetching order`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const result = await mockAPIService.getOrderById(id);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Order fetched successfully',
        data: result.data
      });
    }

    // Handle 404 or other errors
    const statusCode = result.status === 404 ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: result.status === 404 ? 'Order not found' : 'Failed to fetch order',
      error: result.error
    });

  } catch (error) {
    console.error('[Controller] Error in getOrderById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * POST /api/order-processor
 * Create a new order in MockAPI
 */
export const createOrder = async (req, res) => {
  try {
    console.log('[Controller] POST /api/order-processor - Creating new order');

    const orderData = req.body;

    // Basic validation
    if (!orderData) {
      return res.status(400).json({
        success: false,
        message: 'Order data is required'
      });
    }

    // Validate required fields
    const requiredFields = ['customerName', 'restaurantName', 'totalAmount', 'deliveryAddress'];
    const missingFields = requiredFields.filter(field => !orderData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }

    const result = await mockAPIService.createOrder(orderData);

    if (result.success) {
      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: result.data
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create order in MockAPI',
      error: result.error
    });

  } catch (error) {
    console.error('[Controller] Error in createOrder:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * PUT /api/order-processor/:id
 * Update an entire order (full replacement)
 */
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`[Controller] PUT /api/order-processor/${id} - Updating order`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Update data is required'
      });
    }

    const result = await mockAPIService.updateOrder(id, updateData);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Order updated successfully',
        data: result.data
      });
    }

    const statusCode = result.status === 404 ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: result.status === 404 ? 'Order not found' : 'Failed to update order',
      error: result.error
    });

  } catch (error) {
    console.error('[Controller] Error in updateOrder:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * PATCH /api/order-processor/:id
 * Partially update an order
 */
export const patchOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const patchData = req.body;

    console.log(`[Controller] PATCH /api/order-processor/${id} - Patching order`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    if (!patchData || Object.keys(patchData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patch data is required'
      });
    }

    const result = await mockAPIService.patchOrder(id, patchData);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Order patched successfully',
        data: result.data
      });
    }

    const statusCode = result.status === 404 ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: result.status === 404 ? 'Order not found' : 'Failed to patch order',
      error: result.error
    });

  } catch (error) {
    console.error('[Controller] Error in patchOrder:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * DELETE /api/order-processor/:id
 * Delete an order from MockAPI
 */
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Controller] DELETE /api/order-processor/${id} - Deleting order`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const result = await mockAPIService.deleteOrder(id);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Order deleted successfully',
        data: result.data
      });
    }

    const statusCode = result.status === 404 ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: result.status === 404 ? 'Order not found' : 'Failed to delete order',
      error: result.error
    });

  } catch (error) {
    console.error('[Controller] Error in deleteOrder:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * PATCH /api/order-processor/:id/status
 * Update order status (convenience endpoint)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`[Controller] PATCH /api/order-processor/${id}/status - Updating status to ${status}`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        validStatuses: validStatuses
      });
    }

    const result = await mockAPIService.updateOrderStatus(id, status);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        data: result.data
      });
    }

    const statusCode = result.status === 404 ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: result.status === 404 ? 'Order not found' : 'Failed to update order status',
      error: result.error
    });

  } catch (error) {
    console.error('[Controller] Error in updateOrderStatus:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * GET /api/order-processor/test
 * Test MockAPI connection
 */
export const testConnection = async (req, res) => {
  try {
    console.log('[Controller] GET /api/order-processor/test - Testing connection');

    const result = await mockAPIService.testConnection();

    const statusCode = result.success ? 200 : 503;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('[Controller] Error in testConnection:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to test connection',
      error: error.message
    });
  }
};

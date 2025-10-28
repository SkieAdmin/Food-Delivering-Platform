import axios from 'axios';
import { config } from '../config/api-keys.js';

/**
 * MockAPI Service for Order Processing
 * Simulates external order processing system using MockAPI.io
 *
 * Base URL: https://68e85f93f2707e6128caa838.mockapi.io/order/processor
 *
 * This service acts as a connector between our Express backend
 * and the external MockAPI order processing system.
 */

class MockAPIService {
  constructor() {
    // Build full URL from config
    const baseUrl = config.mockAPI.baseUrl;
    this.baseURL = `${baseUrl}/order/processor`;
    this.timeout = config.mockAPI.timeout;
    this.projectId = config.mockAPI.projectId;
  }

  /**
   * Get base URL for MockAPI
   */
  getBaseURL() {
    return this.baseURL;
  }

  /**
   * GET - Fetch all orders from MockAPI
   * @returns {Promise<Array>} Array of orders
   */
  async getAllOrders() {
    try {
      console.log('[MockAPI] Fetching all orders...');
      const response = await axios.get(this.baseURL, {
        timeout: this.timeout
      });

      console.log(`[MockAPI] Successfully fetched ${response.data.length} orders`);
      return {
        success: true,
        data: response.data,
        count: response.data.length
      };
    } catch (error) {
      console.error('[MockAPI] Error fetching orders:', error.message);
      return this.handleError(error, 'fetch all orders');
    }
  }

  /**
   * GET - Fetch a single order by ID from MockAPI
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order object
   */
  async getOrderById(orderId) {
    try {
      console.log(`[MockAPI] Fetching order ${orderId}...`);
      const response = await axios.get(`${this.baseURL}/${orderId}`, {
        timeout: this.timeout
      });

      console.log(`[MockAPI] Successfully fetched order ${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`[MockAPI] Error fetching order ${orderId}:`, error.message);
      return this.handleError(error, `fetch order ${orderId}`);
    }
  }

  /**
   * POST - Create a new order in MockAPI
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    try {
      console.log('[MockAPI] Creating new order...');

      // Validate required fields
      const validatedData = this.validateOrderData(orderData);

      const response = await axios.post(this.baseURL, validatedData, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`[MockAPI] Successfully created order ${response.data.id}`);
      return {
        success: true,
        data: response.data,
        message: 'Order created successfully'
      };
    } catch (error) {
      console.error('[MockAPI] Error creating order:', error.message);
      return this.handleError(error, 'create order');
    }
  }

  /**
   * PUT - Update an existing order in MockAPI
   * @param {string} orderId - Order ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated order
   */
  async updateOrder(orderId, updateData) {
    try {
      console.log(`[MockAPI] Updating order ${orderId}...`);

      const response = await axios.put(`${this.baseURL}/${orderId}`, updateData, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`[MockAPI] Successfully updated order ${orderId}`);
      return {
        success: true,
        data: response.data,
        message: 'Order updated successfully'
      };
    } catch (error) {
      console.error(`[MockAPI] Error updating order ${orderId}:`, error.message);
      return this.handleError(error, `update order ${orderId}`);
    }
  }

  /**
   * PATCH - Partially update an order (e.g., status change)
   * @param {string} orderId - Order ID
   * @param {Object} patchData - Data to patch
   * @returns {Promise<Object>} Updated order
   */
  async patchOrder(orderId, patchData) {
    try {
      console.log(`[MockAPI] Patching order ${orderId}...`);

      const response = await axios.patch(`${this.baseURL}/${orderId}`, patchData, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`[MockAPI] Successfully patched order ${orderId}`);
      return {
        success: true,
        data: response.data,
        message: 'Order patched successfully'
      };
    } catch (error) {
      console.error(`[MockAPI] Error patching order ${orderId}:`, error.message);
      return this.handleError(error, `patch order ${orderId}`);
    }
  }

  /**
   * DELETE - Delete an order from MockAPI
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteOrder(orderId) {
    try {
      console.log(`[MockAPI] Deleting order ${orderId}...`);

      const response = await axios.delete(`${this.baseURL}/${orderId}`, {
        timeout: this.timeout
      });

      console.log(`[MockAPI] Successfully deleted order ${orderId}`);
      return {
        success: true,
        data: response.data,
        message: 'Order deleted successfully'
      };
    } catch (error) {
      console.error(`[MockAPI] Error deleting order ${orderId}:`, error.message);
      return this.handleError(error, `delete order ${orderId}`);
    }
  }

  /**
   * Update order status (common operation)
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status) {
    try {
      console.log(`[MockAPI] Updating order ${orderId} status to ${status}...`);

      const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }

      return await this.patchOrder(orderId, {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[MockAPI] Error updating order status:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate order data before sending to MockAPI
   * @param {Object} orderData - Order data
   * @returns {Object} Validated order data
   */
  validateOrderData(orderData) {
    const validated = {
      orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
      customerId: orderData.customerId || null,
      customerName: orderData.customerName || 'Guest',
      restaurantId: orderData.restaurantId || null,
      restaurantName: orderData.restaurantName || 'Unknown Restaurant',
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      deliveryAddress: orderData.deliveryAddress || '',
      deliveryFee: orderData.deliveryFee || 0,
      status: orderData.status || 'PENDING',
      paymentMethod: orderData.paymentMethod || 'CASH',
      paymentStatus: orderData.paymentStatus || 'PENDING',
      notes: orderData.notes || '',
      createdAt: orderData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return validated;
  }

  /**
   * Handle errors consistently
   * @param {Error} error - Error object
   * @param {string} operation - Operation that failed
   * @returns {Object} Error response
   */
  handleError(error, operation) {
    const errorResponse = {
      success: false,
      operation: operation,
      error: error.message
    };

    if (error.response) {
      // Server responded with error
      errorResponse.status = error.response.status;
      errorResponse.statusText = error.response.statusText;
      errorResponse.data = error.response.data;
    } else if (error.request) {
      // Request made but no response
      errorResponse.error = 'No response from MockAPI server';
      errorResponse.details = 'The request was made but no response was received';
    } else {
      // Error in request setup
      errorResponse.error = error.message;
    }

    return errorResponse;
  }

  /**
   * Test connection to MockAPI
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      console.log('[MockAPI] Testing connection...');
      const response = await axios.get(this.baseURL, {
        timeout: 5000
      });

      return {
        success: true,
        message: 'MockAPI connection successful',
        baseURL: this.baseURL,
        recordsFound: response.data.length
      };
    } catch (error) {
      console.error('[MockAPI] Connection test failed:', error.message);
      return {
        success: false,
        message: 'MockAPI connection failed',
        baseURL: this.baseURL,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export default new MockAPIService();

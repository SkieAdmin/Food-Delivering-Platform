import axios from 'axios';
import { config } from '../config/api-keys.js';

/**
 * GCash Payment Service for Philippines Market
 * Integration with GCash API for payment processing
 *
 * Documentation: https://developer.gcash.com/
 */

class GCashService {
  constructor() {
    this.apiUrl = process.env.GCASH_API_URL || 'https://api.gcash.com/v1';
    this.appId = process.env.GCASH_APP_ID;
    this.appSecret = process.env.GCASH_APP_SECRET;
    this.merchantId = process.env.GCASH_MERCHANT_ID;
    this.environment = process.env.GCASH_ENVIRONMENT || 'sandbox';
  }

  /**
   * Generate authentication token for GCash API
   */
  async getAuthToken() {
    try {
      const response = await axios.post(`${this.apiUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.appId,
        client_secret: this.appSecret
      });

      return response.data.access_token;
    } catch (error) {
      console.error('GCash Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with GCash');
    }
  }

  /**
   * Create a payment request
   * @param {Object} orderData - Order information
   * @returns {Object} Payment response with redirect URL
   */
  async createPayment(orderData) {
    try {
      const token = await this.getAuthToken();

      const paymentData = {
        merchant_id: this.merchantId,
        reference_id: orderData.orderNumber,
        amount: {
          value: orderData.totalAmount.toFixed(2),
          currency: 'PHP'
        },
        description: `Food delivery order ${orderData.orderNumber}`,
        redirect_url: {
          success: `${process.env.APP_URL}/orders/${orderData.orderId}/payment/success`,
          failure: `${process.env.APP_URL}/orders/${orderData.orderId}/payment/failed`
        },
        customer: {
          name: `${orderData.customerFirstName} ${orderData.customerLastName}`,
          email: orderData.customerEmail,
          phone: orderData.customerPhone
        },
        metadata: {
          order_id: orderData.orderId,
          restaurant_id: orderData.restaurantId,
          delivery_fee: orderData.deliveryFee,
          platform_fee: orderData.platformFee
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/payments`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        paymentId: response.data.payment_id,
        redirectUrl: response.data.redirect_url,
        status: response.data.status,
        expiresAt: response.data.expires_at
      };

    } catch (error) {
      console.error('GCash Payment Creation Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Payment creation failed'
      };
    }
  }

  /**
   * Verify payment status
   * @param {String} paymentId - GCash payment ID
   * @returns {Object} Payment verification result
   */
  async verifyPayment(paymentId) {
    try {
      const token = await this.getAuthToken();

      const response = await axios.get(
        `${this.apiUrl}/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const payment = response.data;

      return {
        success: true,
        paymentId: payment.payment_id,
        status: payment.status, // pending, processing, completed, failed
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency,
        paidAt: payment.paid_at,
        referenceId: payment.reference_id,
        metadata: payment.metadata
      };

    } catch (error) {
      console.error('GCash Payment Verification Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Payment verification failed'
      };
    }
  }

  /**
   * Process refund for cancelled orders
   * @param {String} paymentId - Original payment ID
   * @param {Number} amount - Refund amount in PHP
   * @param {String} reason - Refund reason
   * @returns {Object} Refund result
   */
  async processRefund(paymentId, amount, reason = 'Order cancelled') {
    try {
      const token = await this.getAuthToken();

      const refundData = {
        payment_id: paymentId,
        amount: {
          value: amount.toFixed(2),
          currency: 'PHP'
        },
        reason: reason
      };

      const response = await axios.post(
        `${this.apiUrl}/refunds`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        refundId: response.data.refund_id,
        status: response.data.status,
        amount: parseFloat(response.data.amount.value),
        refundedAt: response.data.refunded_at
      };

    } catch (error) {
      console.error('GCash Refund Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Refund processing failed'
      };
    }
  }

  /**
   * Process payout to restaurant or driver
   * @param {Object} payoutData - Payout information
   * @returns {Object} Payout result
   */
  async processPayout(payoutData) {
    try {
      const token = await this.getAuthToken();

      const payload = {
        merchant_id: this.merchantId,
        reference_id: payoutData.referenceId,
        recipient: {
          type: payoutData.recipientType, // 'gcash_account' or 'bank_account'
          account_number: payoutData.accountNumber,
          account_name: payoutData.accountName
        },
        amount: {
          value: payoutData.amount.toFixed(2),
          currency: 'PHP'
        },
        description: payoutData.description,
        metadata: {
          settlement_id: payoutData.settlementId,
          period: payoutData.period
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/payouts`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        payoutId: response.data.payout_id,
        status: response.data.status,
        processedAt: response.data.processed_at
      };

    } catch (error) {
      console.error('GCash Payout Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Payout processing failed'
      };
    }
  }

  /**
   * Check wallet balance (for merchant account)
   * @returns {Object} Balance information
   */
  async checkBalance() {
    try {
      const token = await this.getAuthToken();

      const response = await axios.get(
        `${this.apiUrl}/merchant/${this.merchantId}/balance`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        balance: parseFloat(response.data.available_balance),
        currency: response.data.currency,
        pendingBalance: parseFloat(response.data.pending_balance)
      };

    } catch (error) {
      console.error('GCash Balance Check Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to check balance'
      };
    }
  }

  /**
   * Handle GCash webhook notifications
   * @param {Object} webhookData - Data from GCash webhook
   * @returns {Object} Processed webhook data
   */
  async handleWebhook(webhookData) {
    try {
      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(
        webhookData,
        webhookData.signature
      );

      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      const event = webhookData.event_type;
      const payment = webhookData.data;

      return {
        success: true,
        event: event,
        paymentId: payment.payment_id,
        status: payment.status,
        referenceId: payment.reference_id,
        amount: parseFloat(payment.amount.value)
      };

    } catch (error) {
      console.error('GCash Webhook Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify webhook signature
   * @private
   */
  verifyWebhookSignature(data, signature) {
    // Implement signature verification logic
    // This is a placeholder - actual implementation depends on GCash documentation
    const crypto = require('crypto');
    const payload = JSON.stringify(data);
    const hash = crypto
      .createHmac('sha256', this.appSecret)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }
}

export default new GCashService();

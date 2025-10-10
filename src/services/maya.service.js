import axios from 'axios';
import { config } from '../config/api-keys.js';

/**
 * Maya (PayMaya) Payment Service for Philippines Market
 * Integration with Maya API for payment processing
 *
 * Documentation: https://developers.paymaya.com/
 */

class MayaService {
  constructor() {
    this.apiUrl = process.env.MAYA_API_URL || 'https://pg-sandbox.paymaya.com';
    this.publicKey = process.env.MAYA_PUBLIC_KEY;
    this.secretKey = process.env.MAYA_SECRET_KEY;
    this.environment = process.env.MAYA_ENVIRONMENT || 'sandbox';
  }

  /**
   * Get authorization header
   * @private
   */
  getAuthHeader(usePublicKey = false) {
    const key = usePublicKey ? this.publicKey : this.secretKey;
    const encoded = Buffer.from(key + ':').toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Create a payment checkout
   * @param {Object} orderData - Order information
   * @returns {Object} Payment response with redirect URL
   */
  async createCheckout(orderData) {
    try {
      const checkoutData = {
        totalAmount: {
          value: orderData.totalAmount,
          currency: 'PHP'
        },
        buyer: {
          firstName: orderData.customerFirstName,
          middleName: '',
          lastName: orderData.customerLastName,
          contact: {
            phone: orderData.customerPhone,
            email: orderData.customerEmail
          }
        },
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          code: item.id,
          description: item.description || '',
          amount: {
            value: item.price,
            details: {
              subtotal: item.subtotal
            }
          },
          totalAmount: {
            value: item.subtotal,
            currency: 'PHP'
          }
        })),
        redirectUrl: {
          success: `${process.env.APP_URL}/orders/${orderData.orderId}/payment/success`,
          failure: `${process.env.APP_URL}/orders/${orderData.orderId}/payment/failed`,
          cancel: `${process.env.APP_URL}/orders/${orderData.orderId}/payment/cancelled`
        },
        requestReferenceNumber: orderData.orderNumber,
        metadata: {
          orderId: orderData.orderId,
          restaurantId: orderData.restaurantId,
          deliveryFee: orderData.deliveryFee,
          platformFee: orderData.platformFee
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/checkout/v1/checkouts`,
        checkoutData,
        {
          headers: {
            'Authorization': this.getAuthHeader(true),
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        checkoutId: response.data.checkoutId,
        redirectUrl: response.data.redirectUrl,
        status: 'created',
        expiresAt: response.data.expiresAt
      };

    } catch (error) {
      console.error('Maya Checkout Creation Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Checkout creation failed'
      };
    }
  }

  /**
   * Create a payment using Payment Vault (saved cards)
   * @param {Object} paymentData - Payment information
   * @returns {Object} Payment result
   */
  async createPayment(paymentData) {
    try {
      const payload = {
        totalAmount: {
          value: paymentData.amount,
          currency: 'PHP'
        },
        buyer: {
          firstName: paymentData.customerFirstName,
          lastName: paymentData.customerLastName,
          contact: {
            phone: paymentData.customerPhone,
            email: paymentData.customerEmail
          }
        },
        requestReferenceNumber: paymentData.orderNumber,
        redirectUrl: {
          success: paymentData.successUrl,
          failure: paymentData.failureUrl,
          cancel: paymentData.cancelUrl
        },
        metadata: paymentData.metadata
      };

      const response = await axios.post(
        `${this.apiUrl}/payments/v1/payments`,
        payload,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        paymentId: response.data.id,
        status: response.data.status,
        receiptNumber: response.data.receiptNumber
      };

    } catch (error) {
      console.error('Maya Payment Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Payment processing failed'
      };
    }
  }

  /**
   * Verify payment status
   * @param {String} checkoutId - Maya checkout ID
   * @returns {Object} Payment verification result
   */
  async verifyPayment(checkoutId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/checkout/v1/checkouts/${checkoutId}`,
        {
          headers: {
            'Authorization': this.getAuthHeader()
          }
        }
      );

      const checkout = response.data;

      return {
        success: true,
        checkoutId: checkout.checkoutId,
        status: checkout.status, // CREATED, COMPLETED, EXPIRED, CANCELLED
        transactionReferenceNumber: checkout.transactionReferenceNumber,
        receiptNumber: checkout.receiptNumber,
        paymentType: checkout.paymentType,
        amount: checkout.totalAmount.value,
        currency: checkout.totalAmount.currency,
        metadata: checkout.metadata
      };

    } catch (error) {
      console.error('Maya Verification Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Payment verification failed'
      };
    }
  }

  /**
   * Process refund
   * @param {String} paymentId - Original payment ID
   * @param {Number} amount - Refund amount
   * @param {String} reason - Refund reason
   * @returns {Object} Refund result
   */
  async processRefund(paymentId, amount, reason = 'Order cancelled') {
    try {
      const refundData = {
        totalAmount: {
          value: amount,
          currency: 'PHP'
        },
        reason: reason
      };

      const response = await axios.post(
        `${this.apiUrl}/payments/v1/payments/${paymentId}/refunds`,
        refundData,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        refundId: response.data.id,
        status: response.data.status,
        amount: response.data.totalAmount.value,
        refundedAt: response.data.refundedAt
      };

    } catch (error) {
      console.error('Maya Refund Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Refund processing failed'
      };
    }
  }

  /**
   * Create a payout to restaurant or driver
   * @param {Object} payoutData - Payout information
   * @returns {Object} Payout result
   */
  async createPayout(payoutData) {
    try {
      const payload = {
        amount: payoutData.amount.toFixed(2),
        currency: 'PHP',
        description: payoutData.description,
        destination: {
          type: 'BANK_ACCOUNT', // or 'MAYA_ACCOUNT'
          accountNumber: payoutData.accountNumber,
          accountName: payoutData.accountName,
          bankCode: payoutData.bankCode // For bank transfers
        },
        metadata: {
          settlementId: payoutData.settlementId,
          recipientType: payoutData.recipientType,
          recipientId: payoutData.recipientId
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/payouts/v1/payouts`,
        payload,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        payoutId: response.data.id,
        status: response.data.status,
        referenceNumber: response.data.referenceNumber,
        processedAt: response.data.processedAt
      };

    } catch (error) {
      console.error('Maya Payout Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Payout processing failed'
      };
    }
  }

  /**
   * Get payout status
   * @param {String} payoutId - Payout ID
   * @returns {Object} Payout status
   */
  async getPayoutStatus(payoutId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/payouts/v1/payouts/${payoutId}`,
        {
          headers: {
            'Authorization': this.getAuthHeader()
          }
        }
      );

      return {
        success: true,
        payoutId: response.data.id,
        status: response.data.status, // PENDING, FOR_PROCESSING, SUCCESS, FAILED
        amount: parseFloat(response.data.amount),
        processedAt: response.data.processedAt
      };

    } catch (error) {
      console.error('Maya Payout Status Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to get payout status'
      };
    }
  }

  /**
   * Create payment token for recurring payments
   * @param {Object} cardData - Card information
   * @returns {Object} Token result
   */
  async createPaymentToken(cardData) {
    try {
      const tokenData = {
        card: {
          number: cardData.cardNumber,
          expMonth: cardData.expMonth,
          expYear: cardData.expYear,
          cvc: cardData.cvc
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/payments/v1/payment-tokens`,
        tokenData,
        {
          headers: {
            'Authorization': this.getAuthHeader(true),
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        paymentTokenId: response.data.paymentTokenId,
        state: response.data.state,
        cardType: response.data.cardType,
        maskedPan: response.data.maskedPan
      };

    } catch (error) {
      console.error('Maya Token Creation Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Token creation failed'
      };
    }
  }

  /**
   * Handle Maya webhook notifications
   * @param {Object} webhookData - Data from Maya webhook
   * @returns {Object} Processed webhook data
   */
  async handleWebhook(webhookData) {
    try {
      const eventType = webhookData.name;
      const data = webhookData.data;

      // Map webhook event types
      const eventMapping = {
        'CHECKOUT_SUCCESS': 'payment.success',
        'CHECKOUT_FAILURE': 'payment.failed',
        'CHECKOUT_DROPOUT': 'payment.cancelled',
        'PAYMENT_SUCCESS': 'payment.success',
        'PAYMENT_FAILED': 'payment.failed',
        'PAYMENT_EXPIRED': 'payment.expired'
      };

      return {
        success: true,
        event: eventMapping[eventType] || eventType,
        checkoutId: data.checkoutId || data.id,
        status: data.status,
        referenceNumber: data.requestReferenceNumber,
        amount: data.totalAmount?.value,
        metadata: data.metadata
      };

    } catch (error) {
      console.error('Maya Webhook Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available Philippine banks for payout
   * @returns {Array} List of banks
   */
  getPhilippineBanks() {
    return [
      { code: 'BDO', name: 'Banco de Oro' },
      { code: 'BPI', name: 'Bank of the Philippine Islands' },
      { code: 'MBT', name: 'Metrobank' },
      { code: 'UBP', name: 'UnionBank of the Philippines' },
      { code: 'SECB', name: 'Security Bank' },
      { code: 'LBP', name: 'Land Bank of the Philippines' },
      { code: 'PNB', name: 'Philippine National Bank' },
      { code: 'RCBC', name: 'Rizal Commercial Banking Corporation' },
      { code: 'CBC', name: 'Chinabank' },
      { code: 'EWB', name: 'EastWest Bank' }
    ];
  }
}

export default new MayaService();

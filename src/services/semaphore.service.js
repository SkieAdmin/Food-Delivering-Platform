import axios from 'axios';

/**
 * Semaphore SMS Service for Philippines Market
 * Local SMS provider optimized for Philippine mobile networks
 *
 * Documentation: https://semaphore.co/docs
 */

class SemaphoreService {
  constructor() {
    this.apiKey = process.env.SEMAPHORE_API_KEY;
    this.senderName = process.env.SEMAPHORE_SENDER_NAME || 'PHFoodDel';
    this.apiUrl = 'https://api.semaphore.co/api/v4';
  }

  /**
   * Format Philippine mobile number to standard format
   * @param {String} phoneNumber - Phone number in any format
   * @returns {String} Formatted number (+639XXXXXXXXX)
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('0')) {
      cleaned = '63' + cleaned.substring(1);
    } else if (cleaned.startsWith('9')) {
      cleaned = '63' + cleaned;
    } else if (cleaned.startsWith('639')) {
      // Already in correct format
    } else if (cleaned.startsWith('63')) {
      // Already in correct format
    }

    return '+' + cleaned;
  }

  /**
   * Send SMS notification
   * @param {String} phoneNumber - Recipient phone number
   * @param {String} message - SMS message content
   * @returns {Object} Send result
   */
  async sendSMS(phoneNumber, message) {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);

      const response = await axios.post(`${this.apiUrl}/messages`, {
        apikey: this.apiKey,
        number: formattedNumber,
        message: message,
        sendername: this.senderName
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];

        return {
          success: true,
          messageId: result.message_id,
          status: result.status,
          recipient: formattedNumber,
          cost: result.cost
        };
      }

      throw new Error('No response from Semaphore');

    } catch (error) {
      console.error('Semaphore SMS Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send SMS'
      };
    }
  }

  /**
   * Send bulk SMS to multiple recipients
   * @param {Array} phoneNumbers - Array of phone numbers
   * @param {String} message - SMS message
   * @returns {Object} Bulk send result
   */
  async sendBulkSMS(phoneNumbers, message) {
    try {
      const formattedNumbers = phoneNumbers.map(num => this.formatPhoneNumber(num));

      const response = await axios.post(`${this.apiUrl}/messages`, {
        apikey: this.apiKey,
        number: formattedNumbers.join(','),
        message: message,
        sendername: this.senderName
      });

      return {
        success: true,
        sent: response.data.length,
        results: response.data
      };

    } catch (error) {
      console.error('Semaphore Bulk SMS Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to send bulk SMS'
      };
    }
  }

  /**
   * Send OTP (One-Time Password)
   * @param {String} phoneNumber - Recipient phone number
   * @param {String} code - OTP code
   * @returns {Object} Send result
   */
  async sendOTP(phoneNumber, code) {
    const message = `Your ${process.env.PLATFORM_NAME || 'PH Food Delivery'} verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;
    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send order confirmation SMS
   * @param {Object} orderData - Order information
   * @returns {Object} Send result
   */
  async sendOrderConfirmation(orderData) {
    const message = `Order ${orderData.orderNumber} confirmed! Your food from ${orderData.restaurantName} is being prepared. Estimated delivery: ${orderData.estimatedTime} mins. Track: ${process.env.APP_URL}/orders/${orderData.orderId}`;
    return await this.sendSMS(orderData.customerPhone, message);
  }

  /**
   * Send order status update
   * @param {Object} updateData - Status update information
   * @returns {Object} Send result
   */
  async sendOrderStatusUpdate(updateData) {
    const messages = {
      CONFIRMED: `Your order ${updateData.orderNumber} has been confirmed by ${updateData.restaurantName}.`,
      PREPARING: `Your order ${updateData.orderNumber} is now being prepared.`,
      READY: `Your order ${updateData.orderNumber} is ready for pickup by the driver.`,
      OUT_FOR_DELIVERY: `Your order ${updateData.orderNumber} is out for delivery! Driver: ${updateData.driverName}. Track live: ${process.env.APP_URL}/track/${updateData.orderId}`,
      DELIVERED: `Your order ${updateData.orderNumber} has been delivered! Enjoy your meal! Please rate your experience.`,
      CANCELLED: `Your order ${updateData.orderNumber} has been cancelled. Reason: ${updateData.cancelReason}. Refund will be processed within 3-5 business days.`
    };

    const message = messages[updateData.status] || `Order ${updateData.orderNumber} status: ${updateData.status}`;
    return await this.sendSMS(updateData.customerPhone, message);
  }

  /**
   * Send driver assignment notification to customer
   * @param {Object} assignmentData - Driver assignment info
   * @returns {Object} Send result
   */
  async sendDriverAssigned(assignmentData) {
    const message = `Driver ${assignmentData.driverName} has been assigned to your order ${assignmentData.orderNumber}. Vehicle: ${assignmentData.vehicleType} (${assignmentData.vehicleNumber}). Track: ${process.env.APP_URL}/track/${assignmentData.orderId}`;
    return await this.sendSMS(assignmentData.customerPhone, message);
  }

  /**
   * Send delivery notification to driver
   * @param {Object} deliveryData - Delivery information
   * @returns {Object} Send result
   */
  async sendDeliveryRequest(deliveryData) {
    const message = `New delivery request! Order ${deliveryData.orderNumber} from ${deliveryData.restaurantName} to ${deliveryData.deliveryAddress}. Distance: ${deliveryData.distance}km. Fee: ₱${deliveryData.deliveryFee}. Accept in app now!`;
    return await this.sendSMS(deliveryData.driverPhone, message);
  }

  /**
   * Send restaurant order notification
   * @param {Object} orderData - Order information
   * @returns {Object} Send result
   */
  async sendRestaurantNotification(orderData) {
    const message = `New order ${orderData.orderNumber}! ${orderData.itemCount} items, Total: ₱${orderData.totalAmount}. Delivery to: ${orderData.deliveryAddress}. Payment: ${orderData.paymentMethod}. Login to confirm.`;
    return await this.sendSMS(orderData.restaurantPhone, message);
  }

  /**
   * Send promo code SMS
   * @param {String} phoneNumber - Recipient phone number
   * @param {Object} promoData - Promo information
   * @returns {Object} Send result
   */
  async sendPromoCode(phoneNumber, promoData) {
    const message = `🎉 Special offer! Use promo code ${promoData.code} to get ${promoData.discount}% off your next order. Valid until ${promoData.validUntil}. Min order: ₱${promoData.minOrder}. Order now!`;
    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send payment receipt
   * @param {Object} receiptData - Receipt information
   * @returns {Object} Send result
   */
  async sendPaymentReceipt(receiptData) {
    const message = `Payment received! ₱${receiptData.amount} via ${receiptData.method}. Order ${receiptData.orderNumber}. Receipt: ${process.env.APP_URL}/receipts/${receiptData.receiptId}. Thank you for your order!`;
    return await this.sendSMS(receiptData.customerPhone, message);
  }

  /**
   * Check account balance
   * @returns {Object} Balance information
   */
  async checkBalance() {
    try {
      const response = await axios.get(`${this.apiUrl}/account`, {
        params: {
          apikey: this.apiKey
        }
      });

      return {
        success: true,
        balance: response.data.credit_balance,
        currency: 'PHP'
      };

    } catch (error) {
      console.error('Semaphore Balance Check Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to check balance'
      };
    }
  }

  /**
   * Get message status
   * @param {String} messageId - Message ID from send response
   * @returns {Object} Message status
   */
  async getMessageStatus(messageId) {
    try {
      const response = await axios.get(`${this.apiUrl}/messages/${messageId}`, {
        params: {
          apikey: this.apiKey
        }
      });

      return {
        success: true,
        messageId: response.data.message_id,
        status: response.data.status, // Sent, Failed, Queued
        recipient: response.data.recipient,
        sentAt: response.data.sent_at
      };

    } catch (error) {
      console.error('Semaphore Status Check Error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to get message status'
      };
    }
  }

  /**
   * Get SMS pricing for Philippines networks
   * @returns {Object} Pricing information
   */
  getPricing() {
    return {
      smart: 0.50, // ₱0.50 per SMS for Smart network
      globe: 0.50, // ₱0.50 per SMS for Globe network
      sun: 0.50,   // ₱0.50 per SMS for Sun network
      tnt: 0.50,   // ₱0.50 per SMS for TNT network
      currency: 'PHP'
    };
  }

  /**
   * Validate Philippine mobile number
   * @param {String} phoneNumber - Phone number to validate
   * @returns {Boolean} Is valid
   */
  isValidPhilippineNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Check if it's a valid Philippine mobile number
    // Format: 09XX XXX XXXX or +639XX XXX XXXX
    const patterns = [
      /^09\d{9}$/,           // 09XXXXXXXXX
      /^639\d{9}$/,          // 639XXXXXXXXX
      /^\+639\d{9}$/,        // +639XXXXXXXXX
      /^9\d{9}$/             // 9XXXXXXXXX
    ];

    return patterns.some(pattern => pattern.test(cleaned));
  }
}

export default new SemaphoreService();

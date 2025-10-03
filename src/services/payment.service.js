import { config } from '../config/api-keys.js';

// PayPal SDK is client-side, this service handles server-side verification
export const verifyPayment = async (orderId, paymentId) => {
  // In production, verify payment with PayPal API
  // For now, return mock verification
  return {
    success: true,
    paymentId: paymentId,
    status: 'COMPLETED'
  };
};

export const processRefund = async (paymentId) => {
  // In production, process refund with PayPal API
  return {
    success: true,
    refundId: 'REFUND_' + Date.now()
  };
};

export const getPayPalConfig = () => {
  return {
    clientId: config.paypal.clientId,
    currency: 'USD',
    intent: 'capture'
  };
};

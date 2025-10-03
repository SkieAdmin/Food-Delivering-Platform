import twilio from 'twilio';
import { config } from '../config/api-keys.js';

// Check if Twilio is configured
const isTwilioConfigured = () => {
  return config.twilio.accountSid &&
         config.twilio.authToken &&
         config.twilio.accountSid.startsWith('AC') &&
         config.twilio.phoneNumber;
};

// Lazy initialize Twilio client only when needed
const getTwilioClient = () => {
  if (!isTwilioConfigured()) {
    return null;
  }
  return twilio(config.twilio.accountSid, config.twilio.authToken);
};

export const sendOTP = async (phoneNumber, code) => {
  const client = getTwilioClient();

  if (!client) {
    console.log('⚠️  Twilio not configured - SMS sending skipped. OTP:', code);
    return { success: false, error: 'Twilio not configured', code };
  }

  try {
    const message = await client.messages.create({
      body: `Your GoCotano verification code is: ${code}. Valid for 10 minutes.`,
      from: config.twilio.phoneNumber,
      to: phoneNumber
    });
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('SMS Error:', error);
    return { success: false, error: error.message };
  }
};

export const sendOrderConfirmation = async (phoneNumber, orderNumber) => {
  const client = getTwilioClient();

  if (!client) {
    console.log('⚠️  Twilio not configured - Order confirmation SMS skipped');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const message = await client.messages.create({
      body: `Your order #${orderNumber} has been confirmed! We'll notify you when it's ready for delivery.`,
      from: config.twilio.phoneNumber,
      to: phoneNumber
    });
    return { success: true };
  } catch (error) {
    console.error('SMS Error:', error);
    return { success: false };
  }
};

export const sendOrderStatusUpdate = async (phoneNumber, orderNumber, status) => {
  const client = getTwilioClient();

  if (!client) {
    console.log('⚠️  Twilio not configured - Order status SMS skipped');
    return { success: false, error: 'Twilio not configured' };
  }

  const statusMessages = {
    CONFIRMED: `Order #${orderNumber} confirmed! Your food is being prepared.`,
    PREPARING: `Order #${orderNumber} is being prepared by the restaurant.`,
    READY: `Order #${orderNumber} is ready! A driver will pick it up soon.`,
    OUT_FOR_DELIVERY: `Order #${orderNumber} is out for delivery! Track it in real-time.`,
    DELIVERED: `Order #${orderNumber} has been delivered! Enjoy your meal!`
  };

  try {
    const message = await client.messages.create({
      body: statusMessages[status] || `Order #${orderNumber} status: ${status}`,
      from: config.twilio.phoneNumber,
      to: phoneNumber
    });
    return { success: true };
  } catch (error) {
    console.error('SMS Error:', error);
    return { success: false };
  }
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox'
  },
  openStreetMap: {
    nominatimBaseUrl: process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
    osrmBaseUrl: process.env.OSRM_BASE_URL || 'https://router.project-osrm.org',
    tileUrl: process.env.OSM_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    userAgent: process.env.OSM_USER_AGENT || 'PH-Food-Delivery-Platform/1.0'
  },
  mockAPI: {
    baseUrl: process.env.MOCKAPI_BASE_URL || 'https://68e85f93f2707e6128caa838.mockapi.io/order/processor',
    timeout: parseInt(process.env.MOCKAPI_TIMEOUT) || 10000
  }
};

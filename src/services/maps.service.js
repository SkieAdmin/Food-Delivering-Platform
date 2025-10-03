import { config } from '../config/api-keys.js';

export const getApiKey = () => {
  return config.googleMaps.apiKey;
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Haversine formula to calculate distance in kilometers
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

export const estimateDeliveryTime = (distanceKm) => {
  // Assume average speed of 30 km/h in city
  // Add 15 minutes for preparation
  const travelTime = (distanceKm / 30) * 60; // minutes
  const prepTime = 15;
  return Math.round(travelTime + prepTime);
};

import axios from 'axios';

/**
 * OpenStreetMap-based Maps Service for Philippines Food Delivery
 * Uses Nominatim for geocoding and OSRM for routing
 *
 * Free and open-source alternative to Google Maps API
 *
 * APIs Used:
 * - Nominatim (geocoding): https://nominatim.openstreetmap.org/
 * - OSRM (routing): http://router.project-osrm.org/
 */

class OpenStreetMapService {
  constructor() {
    // Nominatim API for geocoding (from environment or default)
    this.nominatimBaseUrl = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';

    // OSRM API for routing (from environment or default)
    this.osrmBaseUrl = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';

    // User agent required by Nominatim
    this.userAgent = process.env.OSM_USER_AGENT || 'PH-Food-Delivery-Platform/1.0';

    // Rate limiting - Nominatim allows 1 request per second
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second
  }

  /**
   * Rate limiting helper
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Calculate distance using Haversine formula (backup/offline method)
   * @param {Number} lat1 - Start latitude
   * @param {Number} lon1 - Start longitude
   * @param {Number} lat2 - End latitude
   * @param {Number} lon2 - End longitude
   * @returns {Number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get detailed route using OSRM API
   * @param {Object} origin - { lat, lng }
   * @param {Object} destination - { lat, lng }
   * @param {Array} waypoints - Optional waypoints
   * @returns {Object} Route information
   */
  async getDirections(origin, destination, waypoints = []) {
    try {
      // Build coordinates string: lon,lat;lon,lat
      let coordinates = `${origin.lng},${origin.lat}`;

      // Add waypoints if any
      waypoints.forEach(wp => {
        coordinates += `;${wp.lng},${wp.lat}`;
      });

      coordinates += `;${destination.lng},${destination.lat}`;

      const response = await axios.get(
        `${this.osrmBaseUrl}/route/v1/driving/${coordinates}`,
        {
          params: {
            overview: 'full',
            geometries: 'polyline',
            steps: true,
            annotations: true
          },
          timeout: 10000
        }
      );

      if (response.data.code === 'Ok' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];

        return {
          success: true,
          distance: {
            value: route.distance, // meters
            text: `${(route.distance / 1000).toFixed(1)} km`,
            km: (route.distance / 1000).toFixed(2)
          },
          duration: {
            value: route.duration, // seconds
            text: `${Math.ceil(route.duration / 60)} mins`,
            minutes: Math.ceil(route.duration / 60)
          },
          polyline: route.geometry,
          steps: leg.steps.map(step => ({
            instruction: this.formatInstruction(step),
            distance: `${(step.distance / 1000).toFixed(1)} km`,
            duration: `${Math.ceil(step.duration / 60)} mins`
          })),
          startAddress: `${origin.lat}, ${origin.lng}`,
          endAddress: `${destination.lat}, ${destination.lng}`
        };
      }

      throw new Error(response.data.code || 'Route not found');

    } catch (error) {
      console.error('OSRM Routing Error:', error.message);

      // Fallback to Haversine calculation
      const distance = this.calculateDistance(
        origin.lat, origin.lng,
        destination.lat, destination.lng
      );

      return {
        success: false,
        fallback: true,
        distance: {
          km: distance.toFixed(2),
          value: distance * 1000
        },
        duration: {
          minutes: this.estimateDeliveryTime(distance)
        },
        error: 'Using fallback calculation'
      };
    }
  }

  /**
   * Format OSRM step instruction
   */
  formatInstruction(step) {
    const maneuvers = {
      'turn': 'Turn',
      'new name': 'Continue on',
      'depart': 'Head',
      'arrive': 'Arrive at',
      'merge': 'Merge',
      'on ramp': 'Take ramp',
      'off ramp': 'Take exit',
      'fork': 'At fork',
      'end of road': 'At end of road',
      'continue': 'Continue',
      'roundabout': 'At roundabout'
    };

    const type = step.maneuver?.type || 'continue';
    const modifier = step.maneuver?.modifier || '';
    const name = step.name || '';

    const action = maneuvers[type] || 'Continue';
    return `${action} ${modifier} ${name}`.trim();
  }

  /**
   * Calculate distances for multiple origins/destinations
   * Note: OSRM doesn't have a direct distance matrix API, so we calculate individually
   * @param {Array} origins - Array of {lat, lng} objects
   * @param {Array} destinations - Array of {lat, lng} objects
   * @returns {Object} Distance matrix
   */
  async getDistanceMatrix(origins, destinations) {
    try {
      const rows = [];

      for (const origin of origins) {
        const elements = [];

        for (const destination of destinations) {
          try {
            const route = await this.getDirections(origin, destination);

            if (route.success) {
              elements.push({
                status: 'OK',
                distance: {
                  value: route.distance.value,
                  text: route.distance.text
                },
                duration: {
                  value: route.duration.value,
                  text: route.duration.text
                }
              });
            } else {
              // Use Haversine fallback
              const distance = this.calculateDistance(
                origin.lat, origin.lng,
                destination.lat, destination.lng
              );

              elements.push({
                status: 'OK',
                distance: {
                  value: distance * 1000,
                  text: `${distance.toFixed(1)} km`
                },
                duration: {
                  value: this.estimateDeliveryTime(distance) * 60,
                  text: `${this.estimateDeliveryTime(distance)} mins`
                }
              });
            }
          } catch (error) {
            elements.push({
              status: 'ERROR',
              distance: null,
              duration: null
            });
          }
        }

        rows.push({ elements });
      }

      return {
        success: true,
        originAddresses: origins.map(o => `${o.lat}, ${o.lng}`),
        destinationAddresses: destinations.map(d => `${d.lat}, ${d.lng}`),
        rows: rows
      };

    } catch (error) {
      console.error('Distance Matrix Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find nearest available driver to restaurant
   * @param {Object} restaurantLocation - { lat, lng }
   * @param {Array} drivers - Array of driver objects with lat/lng
   * @returns {Object} Nearest driver with distance/time
   */
  async findNearestDriver(restaurantLocation, drivers) {
    if (!drivers || drivers.length === 0) {
      return { success: false, error: 'No drivers available' };
    }

    const driverLocations = drivers.map(d => ({
      lat: d.currentLat,
      lng: d.currentLng
    }));

    const matrix = await this.getDistanceMatrix([restaurantLocation], driverLocations);

    if (matrix.success) {
      const elements = matrix.rows[0].elements;
      let nearestIndex = 0;
      let minDistance = Infinity;

      elements.forEach((element, index) => {
        if (element.status === 'OK' && element.distance.value < minDistance) {
          minDistance = element.distance.value;
          nearestIndex = index;
        }
      });

      return {
        success: true,
        driver: drivers[nearestIndex],
        distance: elements[nearestIndex].distance,
        duration: elements[nearestIndex].duration
      };
    }

    // Fallback to Haversine
    let nearestDriver = drivers[0];
    let minDistance = this.calculateDistance(
      restaurantLocation.lat,
      restaurantLocation.lng,
      drivers[0].currentLat,
      drivers[0].currentLng
    );

    drivers.forEach(driver => {
      const distance = this.calculateDistance(
        restaurantLocation.lat,
        restaurantLocation.lng,
        driver.currentLat,
        driver.currentLng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestDriver = driver;
      }
    });

    return {
      success: true,
      driver: nearestDriver,
      distance: { km: minDistance.toFixed(2), value: minDistance * 1000 },
      duration: { minutes: Math.ceil((minDistance / 30) * 60) }
    };
  }

  /**
   * Geocode address to coordinates using Nominatim
   * @param {String} address - Address string
   * @returns {Object} Coordinates and formatted address
   */
  async geocodeAddress(address) {
    try {
      await this.rateLimit();

      const response = await axios.get(`${this.nominatimBaseUrl}/search`, {
        params: {
          q: address,
          format: 'json',
          countrycodes: 'ph', // Philippines only
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];

        return {
          success: true,
          location: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          },
          formattedAddress: result.display_name,
          placeId: result.place_id
        };
      }

      throw new Error('No results found');

    } catch (error) {
      console.error('Geocoding Error:', error.message);
      return {
        success: false,
        error: 'Failed to geocode address'
      };
    }
  }

  /**
   * Reverse geocode coordinates to address using Nominatim
   * @param {Number} lat - Latitude
   * @param {Number} lng - Longitude
   * @returns {Object} Address information
   */
  async reverseGeocode(lat, lng) {
    try {
      await this.rateLimit();

      const response = await axios.get(`${this.nominatimBaseUrl}/reverse`, {
        params: {
          lat: lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
          zoom: 18
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      if (response.data) {
        const result = response.data;

        return {
          success: true,
          formattedAddress: result.display_name,
          addressComponents: result.address,
          placeId: result.place_id
        };
      }

      throw new Error('No results found');

    } catch (error) {
      console.error('Reverse Geocoding Error:', error.message);
      return {
        success: false,
        error: 'Failed to reverse geocode'
      };
    }
  }

  /**
   * Estimate delivery time based on distance
   * @param {Number} distanceKm - Distance in kilometers
   * @returns {Number} Estimated time in minutes
   */
  estimateDeliveryTime(distanceKm) {
    // Average speed in Manila traffic: 20-25 km/h
    // Adjust based on distance (shorter trips = slower avg speed due to stops)
    let avgSpeed = 20;

    if (distanceKm > 10) avgSpeed = 25;
    if (distanceKm > 20) avgSpeed = 30;

    const travelTime = (distanceKm / avgSpeed) * 60; // minutes
    const prepTime = parseInt(process.env.AVERAGE_PREP_TIME) || 30;
    const bufferTime = 5; // Safety buffer

    return Math.round(travelTime + prepTime + bufferTime);
  }

  /**
   * Calculate delivery fee based on distance
   * @param {Number} distanceKm - Distance in kilometers
   * @returns {Number} Delivery fee in PHP
   */
  calculateDeliveryFee(distanceKm) {
    const baseFee = parseFloat(process.env.DEFAULT_DELIVERY_FEE) || 50;
    const perKmFee = parseFloat(process.env.DELIVERY_FEE_PER_KM) || 10;
    const maxDistance = parseFloat(process.env.MAX_DELIVERY_DISTANCE) || 15;

    if (distanceKm > maxDistance) {
      return null; // Outside delivery range
    }

    // First 3km included in base fee
    const extraKm = Math.max(0, distanceKm - 3);
    const totalFee = baseFee + (extraKm * perKmFee);

    return Math.round(totalFee);
  }

  /**
   * Optimize route for multiple deliveries
   * Note: OSRM has a trip optimization endpoint
   * @param {Object} startLocation - Starting point
   * @param {Array} deliveryPoints - Array of delivery locations
   * @returns {Object} Optimized route
   */
  async optimizeRoute(startLocation, deliveryPoints) {
    try {
      // Build coordinates string
      let coordinates = `${startLocation.lng},${startLocation.lat}`;
      deliveryPoints.forEach(point => {
        coordinates += `;${point.lng},${point.lat}`;
      });

      const response = await axios.get(
        `${this.osrmBaseUrl}/trip/v1/driving/${coordinates}`,
        {
          params: {
            overview: 'full',
            geometries: 'polyline',
            steps: false,
            source: 'first', // Start from first coordinate
            destination: 'last' // End at last coordinate
          },
          timeout: 15000
        }
      );

      if (response.data.code === 'Ok' && response.data.trips.length > 0) {
        const trip = response.data.trips[0];

        return {
          success: true,
          optimizedOrder: response.data.waypoints.map((wp, idx) => wp.waypoint_index - 1).filter(idx => idx >= 0),
          totalDistance: trip.distance / 1000,
          totalDuration: trip.duration / 60,
          polyline: trip.geometry
        };
      }

      throw new Error(response.data.code || 'Route optimization failed');

    } catch (error) {
      console.error('Route Optimization Error:', error.message);
      return {
        success: false,
        error: 'Failed to optimize route'
      };
    }
  }

  /**
   * Get API configuration for client-side usage
   * No API key needed for OpenStreetMap!
   */
  getApiKey() {
    return null; // No API key needed
  }
}

// Export singleton instance
export default new OpenStreetMapService();

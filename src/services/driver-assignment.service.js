import prisma from '../config/database.js';
import googleMapsService from './maps.service.js';
import semaphoreService from './semaphore.service.js';

/**
 * Automated Driver Assignment Service
 * Finds and assigns the best available driver for each order
 *
 * Assignment criteria:
 * 1. Driver availability and online status
 * 2. Proximity to restaurant
 * 3. Driver rating
 * 4. Current workload
 */

class DriverAssignmentService {
  /**
   * Find and assign best driver for an order
   * @param {Number} orderId - Order ID
   * @returns {Object} Assignment result
   */
  async assignDriverToOrder(orderId) {
    try {
      // Get order details with restaurant location
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: true,
          customer: true
        }
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Find available drivers in the same city
      const availableDrivers = await this.findAvailableDrivers(
        order.restaurant.city,
        order.restaurant.latitude,
        order.restaurant.longitude
      );

      if (availableDrivers.length === 0) {
        return {
          success: false,
          error: 'No drivers available',
          message: 'All drivers are currently busy. Please try again in a few minutes.'
        };
      }

      // Select best driver using scoring algorithm
      const selectedDriver = await this.selectBestDriver(
        availableDrivers,
        {
          lat: order.restaurant.latitude,
          lng: order.restaurant.longitude
        }
      );

      // Assign driver to order
      await prisma.order.update({
        where: { id: orderId },
        data: {
          driverId: selectedDriver.id,
          status: 'CONFIRMED'
        }
      });

      // Create tracking record
      await prisma.tracking.create({
        data: {
          orderId: orderId,
          driverLat: selectedDriver.currentLat,
          driverLng: selectedDriver.currentLng,
          restaurantLat: order.restaurant.latitude,
          restaurantLng: order.restaurant.longitude,
          customerLat: order.deliveryLat,
          customerLng: order.deliveryLng,
          estimatedTime: selectedDriver.estimatedArrival,
          distanceKm: selectedDriver.distanceToRestaurant,
          currentStatus: 'heading_to_restaurant'
        }
      });

      // Update driver status
      await prisma.driver.update({
        where: { id: selectedDriver.id },
        data: {
          isAvailable: false
        }
      });

      // Calculate delivery fee
      const deliveryFee = googleMapsService.calculateDeliveryFee(
        selectedDriver.distanceToCustomer
      );

      // Send notifications
      await this.sendAssignmentNotifications(order, selectedDriver);

      return {
        success: true,
        driver: {
          id: selectedDriver.id,
          name: selectedDriver.name,
          phone: selectedDriver.phone,
          vehicleType: selectedDriver.vehicleType,
          vehicleNumber: selectedDriver.vehicleNumber,
          rating: selectedDriver.rating
        },
        estimatedArrival: selectedDriver.estimatedArrival,
        deliveryFee: deliveryFee
      };

    } catch (error) {
      console.error('Driver Assignment Error:', error.message);
      return {
        success: false,
        error: 'Failed to assign driver'
      };
    }
  }

  /**
   * Find available drivers in specified city
   * @param {String} city - City name
   * @param {Number} restaurantLat - Restaurant latitude
   * @param {Number} restaurantLng - Restaurant longitude
   * @returns {Array} Available drivers
   */
  async findAvailableDrivers(city, restaurantLat, restaurantLng) {
    const maxRadius = parseFloat(process.env.MAX_DELIVERY_DISTANCE) || 15;

    const drivers = await prisma.driver.findMany({
      where: {
        isAvailable: true,
        isOnline: true,
        currentCity: city,
        currentLat: { not: null },
        currentLng: { not: null }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    // Filter drivers within delivery radius
    const nearbyDrivers = drivers.filter(driver => {
      const distance = googleMapsService.calculateDistance(
        restaurantLat,
        restaurantLng,
        driver.currentLat,
        driver.currentLng
      );
      return distance <= maxRadius;
    });

    return nearbyDrivers;
  }

  /**
   * Select best driver using scoring algorithm
   * @param {Array} drivers - Available drivers
   * @param {Object} restaurantLocation - Restaurant coordinates
   * @returns {Object} Best driver
   */
  async selectBestDriver(drivers, restaurantLocation) {
    // Calculate scores for each driver
    const scoredDrivers = await Promise.all(
      drivers.map(async (driver) => {
        // Get distance and time to restaurant
        const toRestaurant = await googleMapsService.getDirections(
          { lat: driver.currentLat, lng: driver.currentLng },
          restaurantLocation
        );

        const distanceToRestaurant = parseFloat(toRestaurant.distance?.km || 0);
        const timeToRestaurant = parseInt(toRestaurant.duration?.minutes || 0);

        // Scoring factors (0-100 scale)
        const proximityScore = Math.max(0, 100 - (distanceToRestaurant * 10)); // Closer = higher
        const ratingScore = (driver.rating / 5) * 100; // Higher rating = higher
        const experienceScore = Math.min(100, (driver.totalDeliveries / 100) * 100); // More deliveries = higher

        // Weighted total score
        const totalScore =
          (proximityScore * 0.5) + // 50% weight on proximity
          (ratingScore * 0.3) +     // 30% weight on rating
          (experienceScore * 0.2);  // 20% weight on experience

        return {
          ...driver,
          name: `${driver.user.firstName} ${driver.user.lastName}`,
          phone: driver.user.phone,
          distanceToRestaurant,
          timeToRestaurant,
          estimatedArrival: timeToRestaurant,
          score: totalScore
        };
      })
    );

    // Sort by score (highest first) and return best driver
    scoredDrivers.sort((a, b) => b.score - a.score);

    return scoredDrivers[0];
  }

  /**
   * Send assignment notifications to driver and customer
   * @param {Object} order - Order details
   * @param {Object} driver - Driver details
   */
  async sendAssignmentNotifications(order, driver) {
    try {
      // Notify driver
      await semaphoreService.sendDeliveryRequest({
        driverPhone: driver.phone,
        orderNumber: order.orderNumber,
        restaurantName: order.restaurant.name,
        deliveryAddress: order.deliveryAddress,
        distance: driver.distanceToRestaurant,
        deliveryFee: order.deliveryFee
      });

      // Notify customer
      await semaphoreService.sendDriverAssigned({
        customerPhone: order.customer.phone,
        orderNumber: order.orderNumber,
        driverName: driver.name,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber,
        orderId: order.id
      });

    } catch (error) {
      console.error('Notification Error:', error.message);
    }
  }

  /**
   * Reassign order to different driver (if first driver rejects)
   * @param {Number} orderId - Order ID
   * @param {Number} rejectedDriverId - Driver who rejected
   * @returns {Object} Reassignment result
   */
  async reassignOrder(orderId, rejectedDriverId) {
    try {
      // Mark previous driver as available again
      await prisma.driver.update({
        where: { id: rejectedDriverId },
        data: { isAvailable: true }
      });

      // Find new driver (excluding the one who rejected)
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { restaurant: true }
      });

      let availableDrivers = await this.findAvailableDrivers(
        order.restaurant.city,
        order.restaurant.latitude,
        order.restaurant.longitude
      );

      // Exclude driver who rejected
      availableDrivers = availableDrivers.filter(d => d.id !== rejectedDriverId);

      if (availableDrivers.length === 0) {
        return {
          success: false,
          error: 'No other drivers available'
        };
      }

      const newDriver = await this.selectBestDriver(
        availableDrivers,
        {
          lat: order.restaurant.latitude,
          lng: order.restaurant.longitude
        }
      );

      // Update order
      await prisma.order.update({
        where: { id: orderId },
        data: { driverId: newDriver.id }
      });

      await this.sendAssignmentNotifications(order, newDriver);

      return {
        success: true,
        driver: newDriver
      };

    } catch (error) {
      console.error('Reassignment Error:', error.message);
      return {
        success: false,
        error: 'Failed to reassign order'
      };
    }
  }

  /**
   * Get estimated delivery time for an address
   * @param {Number} restaurantId - Restaurant ID
   * @param {Object} deliveryLocation - Delivery coordinates
   * @returns {Object} Time and cost estimation
   */
  async getDeliveryEstimate(restaurantId, deliveryLocation) {
    try {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant) {
        return { success: false, error: 'Restaurant not found' };
      }

      // Get route info
      const route = await googleMapsService.getDirections(
        { lat: restaurant.latitude, lng: restaurant.longitude },
        deliveryLocation
      );

      if (!route.success && !route.fallback) {
        return { success: false, error: 'Unable to calculate route' };
      }

      const distanceKm = parseFloat(route.distance.km);
      const deliveryFee = googleMapsService.calculateDeliveryFee(distanceKm);

      if (deliveryFee === null) {
        return {
          success: false,
          error: `Delivery address is outside our ${process.env.MAX_DELIVERY_DISTANCE}km service range`
        };
      }

      const prepTime = restaurant.preparationTime || 30;
      const deliveryTime = route.duration?.minutes || googleMapsService.estimateDeliveryTime(distanceKm);

      return {
        success: true,
        distance: distanceKm,
        estimatedPrepTime: prepTime,
        estimatedDeliveryTime: deliveryTime,
        totalEstimatedTime: prepTime + deliveryTime,
        deliveryFee: deliveryFee
      };

    } catch (error) {
      console.error('Delivery Estimate Error:', error.message);
      return {
        success: false,
        error: 'Failed to calculate estimate'
      };
    }
  }

  /**
   * Update driver location (called every 10 seconds from driver app)
   * @param {Number} driverId - Driver ID
   * @param {Number} lat - Current latitude
   * @param {Number} lng - Current longitude
   */
  async updateDriverLocation(driverId, lat, lng) {
    try {
      await prisma.driver.update({
        where: { id: driverId },
        data: {
          currentLat: lat,
          currentLng: lng
        }
      });

      // Update tracking for active orders
      const activeOrder = await prisma.order.findFirst({
        where: {
          driverId: driverId,
          status: {
            in: ['OUT_FOR_DELIVERY', 'READY']
          }
        }
      });

      if (activeOrder) {
        await prisma.tracking.update({
          where: { orderId: activeOrder.id },
          data: {
            driverLat: lat,
            driverLng: lng,
            lastUpdated: new Date()
          }
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Location Update Error:', error.message);
      return { success: false, error: 'Failed to update location' };
    }
  }
}

export default new DriverAssignmentService();

import prisma from '../config/database.js';
import gcashService from './gcash.service.js';
import mayaService from './maya.service.js';

/**
 * Commission Calculation and Payment Settlement Service
 * Handles platform fees, restaurant payouts, and driver earnings
 *
 * Payment Flow:
 * Customer → Platform (100%)
 * Platform → Restaurant (subtotal + delivery fee - platform fee)
 * Platform → Driver (delivery fee portion)
 *
 * Platform Commission: 15-20% of order subtotal (configurable)
 */

class SettlementService {
  constructor() {
    this.commissionRate = parseFloat(process.env.PLATFORM_COMMISSION_RATE) || 0.18;
    this.restaurantSchedule = process.env.RESTAURANT_SETTLEMENT_SCHEDULE || 'daily';
    this.driverSchedule = process.env.DRIVER_SETTLEMENT_SCHEDULE || 'daily';
  }

  /**
   * Calculate commission breakdown for an order
   * @param {Object} orderData - Order information
   * @returns {Object} Commission breakdown
   */
  calculateCommission(orderData) {
    const subtotal = orderData.subtotal;
    const deliveryFee = orderData.deliveryFee;
    const discount = orderData.discount || 0;

    // Platform commission (% of subtotal only, not delivery fee)
    const platformFee = subtotal * this.commissionRate;

    // Restaurant receives: subtotal - platform fee - discount
    const restaurantAmount = subtotal - platformFee - discount;

    // Driver receives: full delivery fee
    const driverAmount = deliveryFee;

    // Total amount customer pays
    const totalAmount = subtotal + deliveryFee - discount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      platformFee: parseFloat(platformFee.toFixed(2)),
      restaurantAmount: parseFloat(restaurantAmount.toFixed(2)),
      driverAmount: parseFloat(driverAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2))
    };
  }

  /**
   * Create transaction record and settlement entries
   * @param {Number} orderId - Order ID
   * @param {Object} paymentData - Payment information
   * @returns {Object} Transaction result
   */
  async createTransaction(orderId, paymentData) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: true,
          driver: true
        }
      });

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Calculate commission
      const breakdown = this.calculateCommission({
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discount: order.discount
      });

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          orderId: orderId,
          paymentMethod: paymentData.method,
          amount: breakdown.totalAmount,
          platformFee: breakdown.platformFee,
          restaurantAmount: breakdown.restaurantAmount,
          driverAmount: breakdown.driverAmount,
          status: 'completed',
          gatewayResponse: JSON.stringify(paymentData.gatewayResponse || {})
        }
      });

      // Create restaurant settlement
      const restaurantSettlement = await this.createSettlementRecord({
        orderId: orderId,
        recipientType: 'restaurant',
        recipientId: order.restaurantId,
        amount: breakdown.restaurantAmount
      });

      // Create driver settlement (if driver assigned)
      let driverSettlement = null;
      if (order.driverId) {
        driverSettlement = await this.createSettlementRecord({
          orderId: orderId,
          recipientType: 'driver',
          recipientId: order.driverId,
          amount: breakdown.driverAmount
        });

        // Update driver earnings
        await prisma.driverEarning.create({
          data: {
            driverId: order.driverId,
            orderId: orderId,
            amount: breakdown.driverAmount,
            type: 'delivery_fee',
            status: 'pending'
          }
        });

        await prisma.driver.update({
          where: { id: order.driverId },
          data: {
            totalEarnings: {
              increment: breakdown.driverAmount
            }
          }
        });
      }

      return {
        success: true,
        transaction: transaction,
        breakdown: breakdown,
        settlements: {
          restaurant: restaurantSettlement,
          driver: driverSettlement
        }
      };

    } catch (error) {
      console.error('Transaction Creation Error:', error.message);
      return {
        success: false,
        error: 'Failed to create transaction'
      };
    }
  }

  /**
   * Create a settlement record
   * @param {Object} settlementData - Settlement information
   * @returns {Object} Settlement record
   */
  async createSettlementRecord(settlementData) {
    const schedule = settlementData.recipientType === 'restaurant'
      ? this.restaurantSchedule
      : this.driverSchedule;

    const scheduledFor = this.calculateSettlementDate(schedule);

    return await prisma.settlement.create({
      data: {
        orderId: settlementData.orderId,
        recipientType: settlementData.recipientType,
        recipientId: settlementData.recipientId,
        amount: settlementData.amount,
        status: 'pending',
        scheduledFor: scheduledFor
      }
    });
  }

  /**
   * Calculate settlement date based on schedule
   * @param {String} schedule - daily, weekly, monthly
   * @returns {Date} Scheduled settlement date
   */
  calculateSettlementDate(schedule) {
    const now = new Date();

    switch (schedule) {
      case 'daily':
        // Next day at 9 AM
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;

      case 'weekly':
        // Next Monday at 9 AM
        const nextMonday = new Date(now);
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
        nextMonday.setHours(9, 0, 0, 0);
        return nextMonday;

      case 'monthly':
        // 1st of next month at 9 AM
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
        return nextMonth;

      default:
        return tomorrow;
    }
  }

  /**
   * Process pending settlements (run by cron job)
   * @returns {Object} Processing result
   */
  async processPendingSettlements() {
    try {
      const now = new Date();

      // Get all pending settlements due for processing
      const pendingSettlements = await prisma.settlement.findMany({
        where: {
          status: 'pending',
          scheduledFor: {
            lte: now
          }
        },
        include: {
          order: {
            include: {
              restaurant: {
                include: {
                  user: true
                }
              },
              driver: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      const results = {
        processed: 0,
        failed: 0,
        total: pendingSettlements.length,
        errors: []
      };

      for (const settlement of pendingSettlements) {
        try {
          // Update status to processing
          await prisma.settlement.update({
            where: { id: settlement.id },
            data: { status: 'processing' }
          });

          let payoutResult;

          if (settlement.recipientType === 'restaurant') {
            // Process restaurant payout
            payoutResult = await this.processRestaurantPayout(settlement);
          } else if (settlement.recipientType === 'driver') {
            // Process driver payout
            payoutResult = await this.processDriverPayout(settlement);
          }

          if (payoutResult.success) {
            await prisma.settlement.update({
              where: { id: settlement.id },
              data: {
                status: 'completed',
                processedAt: new Date(),
                paymentReference: payoutResult.referenceNumber
              }
            });

            results.processed++;
          } else {
            await prisma.settlement.update({
              where: { id: settlement.id },
              data: {
                status: 'failed',
                notes: payoutResult.error
              }
            });

            results.failed++;
            results.errors.push({
              settlementId: settlement.id,
              error: payoutResult.error
            });
          }

        } catch (error) {
          console.error(`Settlement ${settlement.id} Error:`, error.message);
          results.failed++;
          results.errors.push({
            settlementId: settlement.id,
            error: error.message
          });
        }
      }

      return {
        success: true,
        results: results
      };

    } catch (error) {
      console.error('Settlement Processing Error:', error.message);
      return {
        success: false,
        error: 'Failed to process settlements'
      };
    }
  }

  /**
   * Process restaurant payout
   * @param {Object} settlement - Settlement record
   * @returns {Object} Payout result
   */
  async processRestaurantPayout(settlement) {
    try {
      // In production, use GCash or Maya API
      // For now, we'll simulate the payout

      const restaurant = settlement.order.restaurant;
      const payoutData = {
        referenceId: `REST_${settlement.id}_${Date.now()}`,
        recipientType: 'bank_account', // or 'gcash_account'
        accountNumber: restaurant.bankAccount || '****', // From restaurant profile
        accountName: restaurant.name,
        amount: settlement.amount,
        description: `Restaurant settlement for order ${settlement.order.orderNumber}`,
        settlementId: settlement.id,
        period: this.getSettlementPeriod()
      };

      // Choose payment gateway (GCash or Maya)
      const result = await gcashService.processPayout(payoutData);

      return {
        success: result.success,
        referenceNumber: result.payoutId,
        error: result.error
      };

    } catch (error) {
      console.error('Restaurant Payout Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process driver payout
   * @param {Object} settlement - Settlement record
   * @returns {Object} Payout result
   */
  async processDriverPayout(settlement) {
    try {
      const driver = settlement.order.driver;

      const payoutData = {
        referenceId: `DRV_${settlement.id}_${Date.now()}`,
        recipientType: 'gcash_account',
        accountNumber: driver.gcashNumber || driver.user.phone,
        accountName: `${driver.user.firstName} ${driver.user.lastName}`,
        amount: settlement.amount,
        description: `Driver earnings for order ${settlement.order.orderNumber}`,
        settlementId: settlement.id,
        period: this.getSettlementPeriod()
      };

      const result = await gcashService.processPayout(payoutData);

      if (result.success) {
        // Update driver earning status
        await prisma.driverEarning.updateMany({
          where: {
            orderId: settlement.orderId,
            driverId: settlement.recipientId
          },
          data: {
            status: 'paid',
            paidAt: new Date()
          }
        });
      }

      return {
        success: result.success,
        referenceNumber: result.payoutId,
        error: result.error
      };

    } catch (error) {
      console.error('Driver Payout Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get settlement period description
   * @returns {String} Period description
   */
  getSettlementPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    if (this.restaurantSchedule === 'daily') {
      return `${year}-${month}-${day}`;
    } else if (this.restaurantSchedule === 'weekly') {
      const weekNumber = Math.ceil(now.getDate() / 7);
      return `${year}-${month}-W${weekNumber}`;
    } else {
      return `${year}-${month}`;
    }
  }

  /**
   * Get settlement summary for restaurant
   * @param {Number} restaurantId - Restaurant ID
   * @param {String} period - Optional period filter
   * @returns {Object} Settlement summary
   */
  async getRestaurantSettlements(restaurantId, period = null) {
    try {
      const where = {
        recipientType: 'restaurant',
        recipientId: restaurantId
      };

      if (period) {
        where.scheduledFor = {
          gte: new Date(period),
          lt: new Date(new Date(period).setMonth(new Date(period).getMonth() + 1))
        };
      }

      const settlements = await prisma.settlement.findMany({
        where: where,
        include: {
          order: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const summary = {
        total: settlements.length,
        pending: settlements.filter(s => s.status === 'pending').length,
        completed: settlements.filter(s => s.status === 'completed').length,
        totalAmount: settlements.reduce((sum, s) => sum + s.amount, 0),
        pendingAmount: settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0),
        completedAmount: settlements.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount, 0),
        settlements: settlements
      };

      return {
        success: true,
        summary: summary
      };

    } catch (error) {
      console.error('Get Restaurant Settlements Error:', error.message);
      return {
        success: false,
        error: 'Failed to get settlements'
      };
    }
  }

  /**
   * Get earnings summary for driver
   * @param {Number} driverId - Driver ID
   * @param {String} period - Optional period filter
   * @returns {Object} Earnings summary
   */
  async getDriverEarnings(driverId, period = null) {
    try {
      const where = {
        driverId: driverId
      };

      if (period) {
        where.createdAt = {
          gte: new Date(period),
          lt: new Date(new Date(period).setMonth(new Date(period).getMonth() + 1))
        };
      }

      const earnings = await prisma.driverEarning.findMany({
        where: where,
        orderBy: {
          createdAt: 'desc'
        }
      });

      const summary = {
        total: earnings.length,
        pending: earnings.filter(e => e.status === 'pending').length,
        paid: earnings.filter(e => e.status === 'paid').length,
        totalEarnings: earnings.reduce((sum, e) => sum + e.amount, 0),
        pendingEarnings: earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
        paidEarnings: earnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
        earnings: earnings
      };

      return {
        success: true,
        summary: summary
      };

    } catch (error) {
      console.error('Get Driver Earnings Error:', error.message);
      return {
        success: false,
        error: 'Failed to get earnings'
      };
    }
  }

  /**
   * Get platform revenue analytics
   * @param {String} period - Period filter (month, week, day)
   * @returns {Object} Revenue analytics
   */
  async getPlatformAnalytics(period = 'month') {
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
        default:
          startDate = new Date(now.setMonth(now.getMonth() - 1));
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: startDate
          },
          status: 'completed'
        }
      });

      const analytics = {
        totalOrders: transactions.length,
        totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
        totalPlatformFees: transactions.reduce((sum, t) => sum + t.platformFee, 0),
        totalRestaurantPayouts: transactions.reduce((sum, t) => sum + t.restaurantAmount, 0),
        totalDriverPayouts: transactions.reduce((sum, t) => sum + t.driverAmount, 0),
        averageOrderValue: transactions.length > 0
          ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
          : 0,
        period: period,
        startDate: startDate,
        endDate: new Date()
      };

      return {
        success: true,
        analytics: analytics
      };

    } catch (error) {
      console.error('Platform Analytics Error:', error.message);
      return {
        success: false,
        error: 'Failed to get analytics'
      };
    }
  }
}

export default new SettlementService();

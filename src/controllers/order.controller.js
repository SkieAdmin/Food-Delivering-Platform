import prisma from '../config/database.js';
import { generateOrderNumber } from '../utils/helpers.js';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../services/sms.service.js';
import { estimateDeliveryTime, calculateDistance } from '../services/maps.service.js';

export const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, deliveryLat, deliveryLng } = req.body;
    const userId = req.session.userId;

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId }
      });

      if (menuItem) {
        totalAmount += menuItem.price * item.quantity;
        orderItems.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: menuItem.price
        });
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: userId,
        restaurantId: parseInt(restaurantId),
        totalAmount,
        deliveryAddress,
        deliveryLat: parseFloat(deliveryLat),
        deliveryLng: parseFloat(deliveryLng),
        orderItems: {
          create: orderItems
        }
      },
      include: {
        customer: true,
        restaurant: true
      }
    });

    // Send SMS confirmation
    await sendOrderConfirmation(order.customer.phone, order.orderNumber);

    res.json({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
};

export const viewOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(id),
        customerId: userId
      },
      include: {
        restaurant: true,
        orderItems: {
          include: {
            menuItem: true
          }
        },
        tracking: true
      }
    });

    if (!order) {
      req.flash('error', 'Order not found');
      return res.redirect('/orders');
    }

    res.render('orders/view', {
      title: `Order #${order.orderNumber}`,
      order,
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('View order error:', error);
    req.flash('error', 'Failed to load order');
    res.redirect('/orders');
  }
};

export const listOrders = async (req, res) => {
  try {
    const userId = req.session.userId;

    const orders = await prisma.order.findMany({
      where: { customerId: userId },
      include: {
        restaurant: true,
        _count: {
          select: { orderItems: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.render('orders/list', {
      title: 'My Orders',
      orders,
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('List orders error:', error);
    req.flash('error', 'Failed to load orders');
    res.redirect('/dashboard');
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status },
      include: {
        customer: true
      }
    });

    // Send SMS notification
    await sendOrderStatusUpdate(order.customer.phone, order.orderNumber, status);

    res.json({ success: true });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false });
  }
};

export const showCheckout = async (req, res) => {
  try {
    const { restaurantId } = req.query;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) }
    });

    res.render('orders/checkout', {
      title: 'Checkout',
      restaurant,
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Checkout error:', error);
    req.flash('error', 'Failed to load checkout');
    res.redirect('/restaurants');
  }
};

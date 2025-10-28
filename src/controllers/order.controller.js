import prisma from '../config/database.js';
import { generateOrderNumber } from '../utils/helpers.js';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../services/sms.service.js';


export const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, deliveryLat, deliveryLng, deliveryCity, contactNumber, paymentMethod } = req.body;
    const userId = req.session.userId;

    console.log('=== CREATE ORDER DEBUG ===');
    console.log('Session userId:', userId);
    console.log('Restaurant ID:', restaurantId);
    console.log('Items:', JSON.stringify(items));
    console.log('Delivery Address:', deliveryAddress);

    // Validate user is logged in
    if (!userId) {
      console.error('ERROR: No userId in session');
      return res.status(401).json({ success: false, error: 'You must be logged in to place an order' });
    }

    // Validate items exist
    if (!items || items.length === 0) {
      console.error('ERROR: No items provided');
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    // Get restaurant to fetch delivery fee
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) }
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    // Get user for contact number fallback
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId }
      });

      if (menuItem) {
        const itemSubtotal = menuItem.price * item.quantity;
        subtotal += itemSubtotal;
        orderItems.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: menuItem.price,
          subtotal: itemSubtotal
        });
      } else {
        console.error(`ERROR: Menu item ${item.menuItemId} not found`);
      }
    }

    // Calculate fees
    const deliveryFee = restaurant.deliveryFee || 50;
    const platformFee = subtotal * 0.15; // 15% platform fee
    const totalAmount = subtotal + deliveryFee;

    console.log('Subtotal:', subtotal);
    console.log('Delivery Fee:', deliveryFee);
    console.log('Platform Fee:', platformFee);
    console.log('Total amount:', totalAmount);
    console.log('Order items count:', orderItems.length);

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: userId,
        restaurantId: parseInt(restaurantId),
        subtotal,
        deliveryFee,
        platformFee,
        totalAmount,
        deliveryAddress,
        deliveryCity: deliveryCity || restaurant.city,
        deliveryLat: parseFloat(deliveryLat),
        deliveryLng: parseFloat(deliveryLng),
        contactNumber: contactNumber || user.phone,
        paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
        orderItems: {
          create: orderItems
        }
      },
      include: {
        customer: true,
        restaurant: true
      }
    });

    console.log('✓ Order created successfully:', order.id, order.orderNumber);
    console.log('✓ Customer ID:', order.customerId);

    // Send SMS confirmation
    try {
      await sendOrderConfirmation(order.customer.phone, order.orderNumber);
      console.log('✓ SMS confirmation sent');
    } catch (smsError) {
      console.error('SMS error (non-critical):', smsError.message);
    }

    res.json({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create order' });
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

    console.log('=== LIST ORDERS DEBUG ===');
    console.log('Session userId:', userId);
    console.log('Session data:', JSON.stringify(req.session));

    if (!userId) {
      console.error('ERROR: No userId in session when listing orders');
      req.flash('error', 'Please login to view orders');
      return res.redirect('/login');
    }

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

    console.log('✓ Found', orders.length, 'orders for userId:', userId);
    if (orders.length > 0) {
      console.log('Sample order:', {
        id: orders[0].id,
        orderNumber: orders[0].orderNumber,
        customerId: orders[0].customerId,
        restaurantName: orders[0].restaurant.name
      });
    }

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

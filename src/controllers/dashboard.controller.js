import prisma from '../config/database.js';

export const showDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userRole = req.session.userRole;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurant: true,
        driver: true
      }
    });

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    // Route to appropriate dashboard based on role
    switch (userRole) {
      case 'CUSTOMER':
        return showCustomerDashboard(req, res, user);
      case 'RESTAURANT':
        return showRestaurantDashboard(req, res, user);
      case 'DRIVER':
        return showDriverDashboard(req, res, user);
      default:
        req.flash('error', 'Invalid user role');
        return res.redirect('/');
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
};

const showCustomerDashboard = async (req, res, user) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: user.id },
      include: {
        restaurant: true,
        _count: {
          select: { orderItems: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const stats = {
      totalOrders: await prisma.order.count({ where: { customerId: user.id } }),
      activeOrders: await prisma.order.count({
        where: {
          customerId: user.id,
          status: {
            in: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY']
          }
        }
      }),
      completedOrders: await prisma.order.count({
        where: { customerId: user.id, status: 'DELIVERED' }
      })
    };

    res.render('dashboard/customer', {
      title: 'Dashboard',
      user,
      orders,
      stats,
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Customer dashboard error:', error);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
};

const showRestaurantDashboard = async (req, res, user) => {
  try {
    if (!user.restaurant) {
      req.flash('error', 'Please complete your restaurant profile');
      return res.redirect('/restaurant/setup');
    }

    const orders = await prisma.order.findMany({
      where: { restaurantId: user.restaurant.id },
      include: {
        customer: true,
        _count: {
          select: { orderItems: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const stats = {
      totalOrders: await prisma.order.count({ where: { restaurantId: user.restaurant.id } }),
      pendingOrders: await prisma.order.count({
        where: {
          restaurantId: user.restaurant.id,
          status: 'PENDING'
        }
      }),
      totalRevenue: await prisma.order.aggregate({
        where: {
          restaurantId: user.restaurant.id,
          status: 'DELIVERED'
        },
        _sum: {
          totalAmount: true
        }
      }),
      menuItems: await prisma.menuItem.count({ where: { restaurantId: user.restaurant.id } })
    };

    res.render('dashboard/restaurant', {
      title: 'Restaurant Dashboard',
      user,
      orders,
      stats,
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Restaurant dashboard error:', error);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
};

const showDriverDashboard = async (req, res, user) => {
  try {
    if (!user.driver) {
      req.flash('error', 'Please complete your driver profile');
      return res.redirect('/driver/setup');
    }

    const orders = await prisma.order.findMany({
      where: { driverId: user.driver.id },
      include: {
        customer: true,
        restaurant: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const availableOrders = await prisma.order.findMany({
      where: {
        driverId: null,
        status: 'READY'
      },
      include: {
        customer: true,
        restaurant: true
      },
      take: 10
    });

    const stats = {
      totalDeliveries: await prisma.order.count({
        where: { driverId: user.driver.id, status: 'DELIVERED' }
      }),
      activeDeliveries: await prisma.order.count({
        where: { driverId: user.driver.id, status: 'OUT_FOR_DELIVERY' }
      }),
      earnings: await prisma.order.aggregate({
        where: {
          driverId: user.driver.id,
          status: 'DELIVERED'
        },
        _sum: {
          totalAmount: true
        }
      })
    };

    res.render('dashboard/driver', {
      title: 'Driver Dashboard',
      user,
      orders,
      availableOrders,
      stats,
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Driver dashboard error:', error);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
};

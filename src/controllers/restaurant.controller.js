import prisma from '../config/database.js';

export const listRestaurants = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    });

    res.render('restaurants/list', {
      title: 'Restaurants',
      restaurants,
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('List restaurants error:', error);
    req.flash('error', 'Failed to load restaurants');
    res.redirect('/');
  }
};

export const viewRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) },
      include: {
        menuItems: {
          where: { available: true }
        }
      }
    });

    if (!restaurant) {
      req.flash('error', 'Restaurant not found');
      return res.redirect('/restaurants');
    }

    res.render('restaurants/menu', {
      title: restaurant.name,
      restaurant,
      userId: req.session?.userId,
      userRole: req.session?.userRole,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('View restaurant error:', error);
    req.flash('error', 'Failed to load restaurant');
    res.redirect('/restaurants');
  }
};

import prisma from '../config/database.js';
import mapsService from '../services/maps.service.js';

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

// Restaurant Owner: Setup restaurant profile
export const showSetup = async (req, res) => {
  try {
    const userId = req.session.userId;

    const existing = await prisma.restaurant.findUnique({ where: { userId } });
    if (existing) {
      req.flash('success', 'Restaurant profile already exists');
      return res.redirect('/dashboard');
    }

    res.render('restaurant/setup', {
      title: 'Setup Restaurant',
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Show restaurant setup error:', error);
    req.flash('error', 'Failed to load setup page');
    res.redirect('/dashboard');
  }
};

export const setupRestaurant = async (req, res) => {
  try {
    const userId = req.session.userId;

    const { name, address, city, cuisine, latitude, longitude } = req.body;

    if (!name || !address || !city || !cuisine) {
      req.flash('error', 'Please fill in all required fields');
      return res.redirect('back');
    }

    const existing = await prisma.restaurant.findUnique({ where: { userId } });
    if (existing) {
      req.flash('success', 'Restaurant profile already exists');
      return res.redirect('/dashboard');
    }

    let latNum = parseFloat(latitude);
    let lngNum = parseFloat(longitude);

    if (!(Number.isFinite(latNum) && Number.isFinite(lngNum))) {
      const geocode = await mapsService.geocodeAddress(`${address}, ${city}, Philippines`);
      if (!geocode.success) {
        req.flash('error', 'Could not locate address. Please refine it or place the pin.');
        return res.redirect('back');
      }
      latNum = geocode.location.lat;
      lngNum = geocode.location.lng;
    }

    await prisma.restaurant.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        latitude: latNum,
        longitude: lngNum,
        cuisine: cuisine.trim(),
        userId
      }
    });

    req.flash('success', 'Restaurant profile created successfully');
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Setup restaurant error:', error);
    req.flash('error', 'Failed to create restaurant');
    res.redirect('back');
  }
};

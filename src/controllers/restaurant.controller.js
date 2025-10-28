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

// Restaurant Owner: Menu management
export const showMenuManager = async (req, res) => {
  try {
    const userId = req.session.userId;
    const restaurant = await prisma.restaurant.findUnique({ where: { userId } });
    if (!restaurant) {
      req.flash('error', 'Please complete your restaurant profile');
      return res.redirect('/restaurant/setup');
    }

    const items = await prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' }
    });

    res.render('restaurant/menu/manage', {
      title: 'Manage Menu',
      restaurant,
      items,
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Show menu manager error:', error);
    req.flash('error', 'Failed to load menu');
    res.redirect('/dashboard');
  }
};

export const showNewMenuItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    const restaurant = await prisma.restaurant.findUnique({ where: { userId } });
    if (!restaurant) {
      req.flash('error', 'Please complete your restaurant profile');
      return res.redirect('/restaurant/setup');
    }

    res.render('restaurant/menu/new', {
      title: 'Add Menu Item',
      restaurant,
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Show new menu item error:', error);
    req.flash('error', 'Failed to load form');
    res.redirect('/restaurant/menu');
  }
};

export const createMenuItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    const restaurant = await prisma.restaurant.findUnique({ where: { userId } });
    if (!restaurant) {
      req.flash('error', 'Please complete your restaurant profile');
      return res.redirect('/restaurant/setup');
    }

    const {
      name,
      description,
      price,
      category,
      image,
      nameFilipino,
      descFilipino,
      isSpicy,
      isVegetarian,
      available
    } = req.body;

    // Determine image URL: uploaded file takes precedence
    let imageUrl = image?.trim() || null;
    if (req.file && req.file.filename) {
      imageUrl = `/uploads/menu/${req.file.filename}`;
    }

    const item = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        nameFilipino: nameFilipino?.trim() || null,
        description: description.trim(),
        descFilipino: descFilipino?.trim() || null,
        price: parseFloat(price),
        image: imageUrl,
        category: category.trim(),
        available: available === 'on' || available === 'true' || available === true,
        isSpicy: isSpicy === 'on' || isSpicy === 'true' || isSpicy === true,
        isVegetarian: isVegetarian === 'on' || isVegetarian === 'true' || isVegetarian === true,
        restaurantId: restaurant.id
      }
    });

    req.flash('success', `Added "${item.name}" to your menu`);
    res.redirect('/restaurant/menu');
  } catch (error) {
    console.error('Create menu item error:', error);
    req.flash('error', 'Failed to add menu item');
    res.redirect('back');
  }
};

// Restaurant Owner: Update menu item
export const updateMenuItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({ where: { userId } });
    if (!restaurant) {
      req.flash('error', 'Please complete your restaurant profile');
      return res.redirect('/restaurant/setup');
    }

    // Verify the menu item belongs to this restaurant
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id: parseInt(id),
        restaurantId: restaurant.id
      }
    });

    if (!existingItem) {
      req.flash('error', 'Menu item not found');
      return res.redirect('/restaurant/menu');
    }

    const {
      name,
      description,
      price,
      category,
      image,
      nameFilipino,
      descFilipino,
      isSpicy,
      isVegetarian,
      available
    } = req.body;

    // Determine image URL: uploaded file takes precedence
    let imageUrl = image?.trim() || existingItem.image;
    if (req.file && req.file.filename) {
      imageUrl = `/uploads/menu/${req.file.filename}`;
    }

    await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        nameFilipino: nameFilipino?.trim() || null,
        description: description.trim(),
        descFilipino: descFilipino?.trim() || null,
        price: parseFloat(price),
        image: imageUrl,
        category: category.trim(),
        available: available === 'on' || available === 'true' || available === true,
        isSpicy: isSpicy === 'on' || isSpicy === 'true' || isSpicy === true,
        isVegetarian: isVegetarian === 'on' || isVegetarian === 'true' || isVegetarian === true
      }
    });

    req.flash('success', `Updated "${name}" successfully`);
    res.redirect('/restaurant/menu');
  } catch (error) {
    console.error('Update menu item error:', error);
    req.flash('error', 'Failed to update menu item');
    res.redirect('back');
  }
};

// Restaurant Owner: Delete menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({ where: { userId } });
    if (!restaurant) {
      req.flash('error', 'Please complete your restaurant profile');
      return res.redirect('/restaurant/setup');
    }

    // Verify the menu item belongs to this restaurant
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id: parseInt(id),
        restaurantId: restaurant.id
      }
    });

    if (!existingItem) {
      req.flash('error', 'Menu item not found');
      return res.redirect('/restaurant/menu');
    }

    await prisma.menuItem.delete({
      where: { id: parseInt(id) }
    });

    req.flash('success', `Deleted "${existingItem.name}" successfully`);
    res.redirect('/restaurant/menu');
  } catch (error) {
    console.error('Delete menu item error:', error);
    req.flash('error', 'Failed to delete menu item');
    res.redirect('back');
  }
};

// Restaurant Owner: Toggle menu item availability (AJAX)
export const toggleAvailability = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({ where: { userId } });
    if (!restaurant) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Verify the menu item belongs to this restaurant
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id: parseInt(id),
        restaurantId: restaurant.id
      }
    });

    if (!existingItem) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: {
        available: !existingItem.available
      }
    });

    res.json({
      success: true,
      available: updatedItem.available,
      message: `${updatedItem.name} is now ${updatedItem.available ? 'Available' : 'Sold Out'}`
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle availability' });
  }
};

// API endpoint to get menu items by IDs
export const getMenuItemsByIds = async (req, res) => {
  try {
    const { ids } = req.query;
    const itemIds = ids.split(',').map(id => parseInt(id));

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: itemIds }
      },
      select: {
        id: true,
        name: true,
        price: true,
        image: true
      }
    });

    res.json({ success: true, items: menuItems });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu items' });
  }
};

import prisma from '../config/database.js';

export const showHomepage = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      take: 6,
      orderBy: {
        rating: 'desc'
      }
    });

    res.render('index', {
      title: 'Home',
      restaurants,
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Homepage error:', error);
    res.render('index', {
      title: 'Home',
      restaurants: [],
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  }
};

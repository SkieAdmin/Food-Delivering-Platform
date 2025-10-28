import prisma from '../config/database.js';

// Driver: Show setup page
export const showSetup = async (req, res) => {
  try {
    const userId = req.session.userId;

    const existing = await prisma.driver.findUnique({
      where: { userId }
    });

    if (existing) {
      req.flash('success', 'Driver profile already exists');
      return res.redirect('/dashboard');
    }

    res.render('driver/setup', {
      title: 'Setup Driver Profile',
      userId: req.session?.userId,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    console.error('Show driver setup error:', error);
    req.flash('error', 'Failed to load setup page');
    res.redirect('/dashboard');
  }
};

// Driver: Complete setup
export const setupDriver = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { vehicleType, vehicleNumber, licenseNumber, currentCity } = req.body;

    if (!vehicleType || !vehicleNumber || !currentCity) {
      req.flash('error', 'Please fill in all required fields');
      return res.redirect('back');
    }

    const existing = await prisma.driver.findUnique({
      where: { userId }
    });

    if (existing) {
      req.flash('success', 'Driver profile already exists');
      return res.redirect('/dashboard');
    }

    await prisma.driver.create({
      data: {
        userId,
        vehicleType: vehicleType.trim(),
        vehicleNumber: vehicleNumber.trim(),
        licenseNumber: licenseNumber?.trim() || null,
        currentCity: currentCity.trim(),
        isAvailable: true,
        isOnline: false
      }
    });

    req.flash('success', 'Driver profile created successfully! You can now start accepting deliveries.');
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Setup driver error:', error);
    req.flash('error', 'Failed to create driver profile');
    res.redirect('back');
  }
};

// Driver: Update availability status
export const updateAvailability = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { isAvailable } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver profile not found' });
    }

    await prisma.driver.update({
      where: { userId },
      data: {
        isAvailable: isAvailable === 'true' || isAvailable === true
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ success: false, error: 'Failed to update availability' });
  }
};

// Driver: Accept order
export const acceptOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { orderId } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver profile not found' });
    }

    // Check if order is still available
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) }
    });

    if (!order || order.driverId !== null) {
      return res.status(400).json({ success: false, error: 'Order is no longer available' });
    }

    // Assign order to driver
    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        driverId: driver.id,
        status: 'OUT_FOR_DELIVERY'
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ success: false, error: 'Failed to accept order' });
  }
};

// Driver: Complete delivery
export const completeDelivery = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { orderId } = req.body;

    const driver = await prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver profile not found' });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        driverId: driver.id
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        status: 'DELIVERED'
      }
    });

    // Update driver stats
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        totalDeliveries: { increment: 1 },
        totalEarnings: { increment: order.deliveryFee }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Complete delivery error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete delivery' });
  }
};

import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit'; // Disabled for development
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './src/config/api-keys.js';

// Import routes
import homeRoutes from './src/routes/home.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import restaurantRoutes from './src/routes/restaurant.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import orderProcessorRoutes from './src/routes/order-processor.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://www.paypal.com", "https://www.paypalobjects.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://nominatim.openstreetmap.org", "https://router.project-osrm.org", "https://www.paypal.com", "https://68e85f93f2707e6128caa838.mockapi.io"],
      frameSrc: ["https://www.paypal.com"]
    }
  }
}));

// Rate limiting disabled for development/school project
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // 5 requests per window
//   message: 'Too many attempts, please try again later'
// });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(flash());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Make user session and config available to all views
app.use((req, res, next) => {
  res.locals.userId = req.session?.userId;
  res.locals.userRole = req.session?.userRole;
  res.locals.config = config; // Make config available to views
  next();
});

// Routes
app.use('/', homeRoutes);
app.use('/', authRoutes); // Rate limiter removed for development
app.use('/restaurants', restaurantRoutes);
app.use('/orders', orderRoutes);
app.use('/dashboard', dashboardRoutes);

// API Routes (MockAPI Integration)
app.use('/api/order-processor', orderProcessorRoutes);

// Socket.IO for real-time tracking
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Driver location update
  socket.on('driver:location-update', async (data) => {
    const { orderId, lat, lng } = data;

    // Update tracking in database
    try {
      const { default: prisma } = await import('./src/config/database.js');
      await prisma.tracking.upsert({
        where: { orderId: parseInt(orderId) },
        update: {
          driverLat: lat,
          driverLng: lng,
          lastUpdated: new Date()
        },
        create: {
          orderId: parseInt(orderId),
          driverLat: lat,
          driverLng: lng
        }
      });

      // Broadcast to customer tracking this order
      io.to(`order-${orderId}`).emit('tracking:update', { lat, lng });
    } catch (error) {
      console.error('Tracking update error:', error);
    }
  });

  // Customer joins order tracking room
  socket.on('tracking:join', (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`Client joined tracking room: order-${orderId}`);
  });

  // Order status update
  socket.on('order:status-update', (data) => {
    io.emit('order:updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Something went wrong!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: '404 Not Found',
    userId: req.session?.userId,
    error: [],
    success: []
  });
});

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 GoCotano Food Delivery Platform`);
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🔵 Light Blue & 🟠 Orange Theme Active\n`);
});

export { io };

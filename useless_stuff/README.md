# 🍔 GoCotano Food Delivery Platform

A complete, production-ready food delivery platform built with Node.js, Express, Prisma, and MySQL. Features real-time order tracking, SMS notifications, PayPal payments, and a modern light blue & orange themed UI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)
![MySQL](https://img.shields.io/badge/mysql-%3E%3D8.0-orange.svg)

## ✨ Features

### Core Functionality
- 🔐 **Authentication System** - SMS OTP verification with Twilio
- 👥 **Multi-Role Support** - Customer, Restaurant Owner, Delivery Driver
- 🍕 **Restaurant Management** - Browse restaurants, view menus, place orders
- 💳 **PayPal Integration** - Secure payment processing
- 📍 **Real-time Tracking** - Live driver location with Google Maps
- 📱 **SMS Notifications** - Order status updates via Twilio
- 🔌 **WebSocket Support** - Real-time updates with Socket.IO

### Design
- 🎨 **Modern UI** - Light blue (#4FC3F7) and orange (#FF9800) theme
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **Fast & Secure** - Helmet.js, rate limiting, XSS protection

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS Templates, Vanilla JavaScript
- **Database**: MySQL with Prisma ORM
- **Real-time**: Socket.IO
- **APIs**: Twilio (SMS), PayPal (Payments), Google Maps (Tracking)
- **Security**: Helmet.js, bcrypt, express-session, csurf

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **npm** or **yarn** package manager

### API Keys Required

You'll need to sign up for these services and obtain API keys:

1. **Twilio** - [Sign up](https://www.twilio.com/try-twilio)
   - Account SID
   - Auth Token
   - Phone Number

2. **PayPal** - [Developer Account](https://developer.paypal.com/)
   - Client ID
   - Client Secret

3. **Google Maps** - [Get API Key](https://developers.google.com/maps/documentation/javascript/get-api-key)
   - Enable Maps JavaScript API
   - Enable Places API

## 🚀 Installation

### 1. Clone or Navigate to the Project

```bash
cd "C:\Users\SkieHackerYTz\Desktop\Food Delivering Platform (Gocotano)"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up MySQL Database

Create a new MySQL database:

```sql
CREATE DATABASE food_delivery;
```

### 4. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
DATABASE_URL="mysql://username:password@localhost:3306/food_delivery"
SESSION_SECRET="your-secret-key-change-this"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-secret"
PAYPAL_MODE="sandbox"
GOOGLE_MAPS_API_KEY="your-google-maps-key"
PORT=3000
```

### 5. Run Database Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Seed the Database

```bash
npm run db:seed
```

This will create:
- 3 sample restaurants with menus
- Sample users for each role
- Test data for development

### 7. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 👤 Sample Login Credentials

After seeding the database, you can log in with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@example.com | password123 |
| Restaurant | pizzapalace@example.com | password123 |
| Driver | driver@example.com | password123 |

## 📁 Project Structure

```
food-delivery-platform/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.js                # Seed script
│   └── migrations/            # Database migrations
├── src/
│   ├── config/
│   │   ├── database.js        # Prisma client
│   │   └── api-keys.js        # API configurations
│   ├── controllers/           # Route handlers
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── home.controller.js
│   │   ├── order.controller.js
│   │   └── restaurant.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   ├── routes/                # Route definitions
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── home.routes.js
│   │   ├── order.routes.js
│   │   └── restaurant.routes.js
│   ├── services/              # Business logic
│   │   ├── sms.service.js     # Twilio integration
│   │   ├── payment.service.js # PayPal integration
│   │   └── maps.service.js    # Google Maps integration
│   ├── views/                 # EJS templates
│   │   ├── layouts/
│   │   ├── partials/
│   │   ├── dashboard/
│   │   ├── restaurants/
│   │   └── orders/
│   └── utils/
│       └── helpers.js         # Helper functions
├── public/
│   ├── css/
│   │   └── style.css          # Light blue & orange theme
│   ├── js/
│   │   └── main.js
│   └── images/
├── server.js                  # Main server file
├── package.json
└── README.md
```

## 🎨 Color Theme

The platform uses a modern, clean design with:

- **Primary Blue**: #4FC3F7, #81D4FA, #B3E5FC
  - Used for headers, navigation, primary elements
- **Orange**: #FF9800, #FFB74D, #FFCC80
  - Used for CTAs, highlights, active states
- **Neutral**: White, light gray backgrounds

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **Session Management**: Secure HTTP-only cookies
- **Rate Limiting**: Protects authentication endpoints
- **Input Validation**: express-validator
- **XSS Protection**: Helmet.js security headers
- **CSRF Protection**: csurf middleware (configurable)

## 📱 API Integration Guide

### Twilio SMS

The platform sends SMS for:
- OTP verification during registration
- Order confirmation
- Order status updates (confirmed, preparing, out for delivery, delivered)

```javascript
// Example usage in code
await sendOTP(phoneNumber, otpCode);
await sendOrderConfirmation(phoneNumber, orderNumber);
await sendOrderStatusUpdate(phoneNumber, orderNumber, status);
```

### PayPal Payments

PayPal integration on checkout page:
- Client-side PayPal SDK
- Server-side verification
- Support for refunds

### Google Maps

Used for:
- Restaurant location display
- Delivery address selection with autocomplete
- Real-time driver tracking
- Distance and ETA calculation

## 🔄 Real-time Features

Socket.IO events:

```javascript
// Driver location updates
socket.emit('driver:location-update', { orderId, lat, lng });

// Customer tracking
socket.on('tracking:update', ({ lat, lng }) => { ... });

// Order status changes
socket.emit('order:status-update', { orderId, status });
```

## 🗄️ Database Schema

Key models:

- **User** - Multi-role users (Customer, Restaurant, Driver)
- **Restaurant** - Restaurant details and locations
- **MenuItem** - Menu items with pricing
- **Order** - Orders with status tracking
- **OrderItem** - Individual items in orders
- **Driver** - Driver information and location
- **Tracking** - Real-time delivery tracking
- **OtpCode** - SMS verification codes

See `prisma/schema.prisma` for full schema.

## 🚦 User Flows

### Customer Flow
1. Register → Verify OTP → Login
2. Browse Restaurants → View Menu
3. Add items to cart → Checkout
4. Enter delivery address (Google Maps)
5. Pay with PayPal
6. Track order in real-time

### Restaurant Owner Flow
1. Register → Verify OTP → Login
2. View incoming orders
3. Accept → Prepare → Mark ready
4. SMS notifications sent automatically

### Driver Flow
1. Register → Verify OTP → Login
2. View available deliveries
3. Accept delivery → Start delivery
4. Update location in real-time
5. Mark as delivered

## 📊 Dashboard Features

### Customer Dashboard
- Total orders, active orders, completed orders
- Recent order history with status
- Quick access to track orders

### Restaurant Dashboard
- Total orders, pending orders, revenue
- Incoming orders management
- Order status updates

### Driver Dashboard
- Total deliveries, active deliveries, earnings
- Available deliveries to accept
- Current delivery management

## 🧪 Testing

To test the platform:

1. Create accounts for each role
2. Add restaurants and menu items (or use seed data)
3. Place test orders as a customer
4. Manage orders as a restaurant owner
5. Accept and deliver as a driver

**Note**: Use PayPal sandbox mode for testing payments.

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check DATABASE_URL in `.env`
- Verify database exists

### SMS Not Sending
- Verify Twilio credentials
- Check phone number format (include country code)
- Ensure Twilio account has credits

### PayPal Not Working
- Use sandbox mode for testing
- Verify PayPal credentials
- Check browser console for errors

### Maps Not Loading
- Verify Google Maps API key
- Enable required APIs (Maps JavaScript, Places)
- Check billing is enabled on Google Cloud

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong `SESSION_SECRET`
3. Enable HTTPS
4. Set secure cookie flags
5. Use production PayPal credentials
6. Configure reverse proxy (nginx)
7. Set up process manager (PM2)
8. Enable database backups
9. Configure logging
10. Set up monitoring

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL="mysql://user:pass@host:3306/db"
SESSION_SECRET="strong-random-secret"
PAYPAL_MODE="live"
# ... other production values
```

## 📝 Scripts

```bash
npm start          # Start server
npm run dev        # Start with nodemon
npm run db:generate # Generate Prisma client
npm run db:migrate  # Run migrations
npm run db:seed     # Seed database
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Support

For issues or questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review API documentation for integrations

## 🎯 Future Enhancements

Potential features to add:
- [ ] Restaurant ratings and reviews
- [ ] Favorite restaurants
- [ ] Order history export
- [ ] Push notifications
- [ ] Promo codes and discounts
- [ ] Multi-language support
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Email notifications
- [ ] Driver earnings dashboard

---

**Built with ❤️ using Node.js, Express, Prisma, and MySQL**

🔵 Light Blue & 🟠 Orange Theme • Real-time Tracking • SMS Notifications • Secure Payments

# 🚀 Setup Checklist for GoCotano

Follow these steps to get your food delivery platform running.

## ✅ Pre-Installation Checklist

- [ ] **Node.js installed** (v16 or higher)
  - Check: `node --version`
- [ ] **MySQL installed** (v8.0 or higher)
  - Check: `mysql --version`
- [ ] **npm installed**
  - Check: `npm --version`

## 📦 Step 1: Install Dependencies

```bash
npm install
```

**Expected output:**
- ✅ 245 packages installed
- ✅ No critical errors

## 🗄️ Step 2: Database Setup

### 2.1 Create Database

Open MySQL and run:

```sql
CREATE DATABASE food_delivery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.2 Configure Database Connection

Edit `.env` file (line 3):

```env
DATABASE_URL="mysql://YOUR_USERNAME:YOUR_PASSWORD@localhost:3306/food_delivery"
```

Replace:
- `YOUR_USERNAME` with your MySQL username (usually `root`)
- `YOUR_PASSWORD` with your MySQL password

## 🔑 Step 3: Environment Variables

Edit `.env` file and configure:

### Required (Minimum to Run)

```env
DATABASE_URL="mysql://root:password@localhost:3306/food_delivery"
SESSION_SECRET="change-this-to-random-string"
PORT=3000
```

### Optional (For Full Features)

#### Twilio SMS (for OTP and notifications)

1. Sign up at https://www.twilio.com/try-twilio
2. Get your credentials from dashboard
3. Add to `.env`:

```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+1234567890"
```

#### PayPal (for payments)

1. Sign up at https://developer.paypal.com/
2. Create a sandbox app
3. Add to `.env`:

```env
PAYPAL_CLIENT_ID="your_client_id_here"
PAYPAL_CLIENT_SECRET="your_client_secret_here"
PAYPAL_MODE="sandbox"
```

#### Google Maps (for location and tracking)

1. Go to https://console.cloud.google.com/
2. Create a project and enable:
   - Maps JavaScript API
   - Places API
3. Add to `.env`:

```env
GOOGLE_MAPS_API_KEY="your_api_key_here"
```

## 🔨 Step 4: Database Migration

```bash
npx prisma generate
```

**Expected output:**
- ✅ Prisma Client generated

```bash
npx prisma migrate dev --name init
```

**Expected output:**
- ✅ Migration completed
- ✅ Database tables created

## 🌱 Step 5: Seed Sample Data

```bash
npm run db:seed
```

**Expected output:**
```
🌱 Seeding database...
✅ Database seeded successfully!

📧 Sample Login Credentials:
Customer: customer@example.com / password123
Restaurant: pizzapalace@example.com / password123
Driver: driver@example.com / password123

🍕 3 Restaurants created with menu items
```

## 🎯 Step 6: Start the Server

```bash
npm run dev
```

**Expected output:**
```
🚀 GoCotano Food Delivery Platform
📍 Server running on http://localhost:3000
🔵 Light Blue & 🟠 Orange Theme Active
```

## ✅ Step 7: Verify Installation

Open browser and visit: **http://localhost:3000**

You should see:
- ✅ Homepage with hero section
- ✅ Light blue & orange theme
- ✅ Featured restaurants section
- ✅ Navigation bar with Login/Sign Up

## 🧪 Step 8: Test the Platform

### Test Customer Flow

1. **Register**
   - [ ] Go to http://localhost:3000/register
   - [ ] Fill in details
   - [ ] Click "Sign Up"
   - [ ] If Twilio configured: Enter OTP from SMS
   - [ ] If Twilio NOT configured: Skip OTP by logging in with seeded account

2. **Browse & Order**
   - [ ] Click "Browse Restaurants"
   - [ ] Select a restaurant
   - [ ] Add items to cart
   - [ ] Click "Proceed to Checkout"
   - [ ] Enter delivery address
   - [ ] If PayPal configured: Complete payment
   - [ ] If PayPal NOT configured: Order will still be created

3. **View Dashboard**
   - [ ] Go to /dashboard
   - [ ] See order statistics
   - [ ] View recent orders

### Test Restaurant Flow

1. **Login as Restaurant**
   - Email: `pizzapalace@example.com`
   - Password: `password123`

2. **Manage Orders**
   - [ ] See incoming orders
   - [ ] Accept orders
   - [ ] Update status (Preparing → Ready)

### Test Driver Flow

1. **Login as Driver**
   - Email: `driver@example.com`
   - Password: `password123`

2. **Manage Deliveries**
   - [ ] See available orders
   - [ ] Accept delivery
   - [ ] Start delivery
   - [ ] Mark as delivered

## 🔧 Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
- Check MySQL is running
- Verify DATABASE_URL in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Issue: "Port 3000 already in use"

**Solution:**
- Change PORT in `.env` to 3001
- Or stop other service using port 3000

### Issue: "Prisma Client not found"

**Solution:**
```bash
npx prisma generate
```

### Issue: "SMS not sending"

**Solution:**
- Platform works without SMS, OTP validation will be skipped
- To enable: Add Twilio credentials to `.env`

### Issue: "PayPal not loading"

**Solution:**
- Platform works without PayPal, orders will still be created
- To enable: Add PayPal credentials to `.env`

### Issue: "Maps not loading"

**Solution:**
- Platform works without Maps, basic address input will be used
- To enable: Add Google Maps API key to `.env`

## 📊 Database Structure Check

Verify tables created:

```sql
USE food_delivery;
SHOW TABLES;
```

**Expected tables:**
- User
- OtpCode
- Restaurant
- MenuItem
- Order
- OrderItem
- Driver
- Tracking
- _prisma_migrations

## 🎨 Customization

### Change Theme Colors

Edit `public/css/style.css`:

```css
:root {
  --primary-blue: #4FC3F7;    /* Change light blue */
  --primary-orange: #FF9800;  /* Change orange */
}
```

### Change Port

Edit `.env`:

```env
PORT=3001
```

### Add More Restaurants

1. Register as Restaurant owner
2. Or modify `prisma/seed.js` and run `npm run db:seed` again

## 🚀 Next Steps

- [ ] Configure API keys for full functionality
- [ ] Customize theme colors if desired
- [ ] Add restaurant images in `public/images/`
- [ ] Test all user flows
- [ ] Review security settings for production
- [ ] Set up SSL certificate for HTTPS
- [ ] Configure domain name

## ✅ Installation Complete!

Your food delivery platform is now running!

**Quick Links:**
- Homepage: http://localhost:3000
- Register: http://localhost:3000/register
- Login: http://localhost:3000/login
- Restaurants: http://localhost:3000/restaurants

**Documentation:**
- README.md - Full documentation
- QUICKSTART.md - Quick start guide
- PROJECT_SUMMARY.md - Project overview

---

**Need help?** Check the troubleshooting section above or review the full README.md

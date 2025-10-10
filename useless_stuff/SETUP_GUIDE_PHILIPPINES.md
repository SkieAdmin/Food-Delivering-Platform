# PH Food Delivery Platform - Complete Setup Guide

Complete step-by-step guide to deploy the food delivery platform for the Philippines market.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [API Configuration](#api-configuration)
4. [Database Setup](#database-setup)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** v16+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **Git** ([Download](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

### Required Accounts (FREE tiers available)
1. **GCash Developer** - https://developer.gcash.com/
2. **Maya (PayMaya)** - https://developers.paymaya.com/
3. **Semaphore SMS** - https://semaphore.co/
4. **Google Cloud** - https://console.cloud.google.com/
5. **Firebase** - https://console.firebase.google.com/
6. **SendGrid** - https://sendgrid.com/
7. **PayPal Developer** - https://developer.paypal.com/ (optional)

---

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/food-delivery-ph.git
cd food-delivery-ph
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- Express.js (web framework)
- Prisma (database ORM)
- Socket.IO (real-time communication)
- GCash, Maya, PayPal SDKs
- Google Maps API client
- Semaphore SMS client
- And more...

### 3. Set Up Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
nano .env  # or use your preferred editor
```

**Minimum configuration to start:**
```env
# Database (required)
DATABASE_URL="mysql://root:yourpassword@localhost:3306/food_delivery_ph"

# Server
PORT=3000
NODE_ENV=development

# Session (required)
SESSION_SECRET="your-random-secret-key-here"

# Platform settings
PLATFORM_COMMISSION_RATE=0.18
DEFAULT_CURRENCY="PHP"
```

You can add API keys later as you obtain them.

### 4. Create MySQL Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE food_delivery_ph CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit MySQL
EXIT;
```

### 5. Run Database Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init
```

You should see:
```
✔ Generated Prisma Client
✔ Migration applied successfully
```

### 6. Seed Sample Data (Optional but Recommended)
```bash
npm run db:seed
```

This creates:
- 3 sample restaurants (Jollibee, McDonald's, Max's)
- 20+ menu items
- 1 test customer account
- 1 test driver account
- Sample promo codes

**Test Accounts Created:**
- **Customer**: customer@test.com / password123
- **Restaurant**: jollibee@test.com / password123
- **Driver**: driver@test.com / password123
- **Admin**: admin@test.com / password123

### 7. Start Development Server
```bash
npm run dev
```

You should see:
```
Server running on http://localhost:3000
Socket.IO ready
```

### 8. Access the Application
Open your browser: **http://localhost:3000**

---

## API Configuration

Configure each API service to unlock full functionality.

### 1. GCash API Setup

#### Sign Up
1. Go to https://developer.gcash.com/
2. Click "Get Started" → Register as developer
3. Verify your email and mobile number

#### Create Application
1. Login to GCash Developer Dashboard
2. Go to "My Applications" → "Create New App"
3. Fill in details:
   - **App Name**: PH Food Delivery
   - **App Type**: E-commerce
   - **Callback URL**: `http://localhost:3000/api/payments/gcash/callback`

#### Get API Credentials
1. Once approved, go to application details
2. Copy:
   - App ID
   - App Secret
   - Merchant ID
3. Add to `.env`:
```env
GCASH_APP_ID="your-app-id"
GCASH_APP_SECRET="your-app-secret"
GCASH_MERCHANT_ID="your-merchant-id"
GCASH_API_URL="https://api.gcash.com/v1"
GCASH_ENVIRONMENT="sandbox"
```

#### Test in Sandbox
- Use GCash test credentials provided in developer portal
- Test payments use fake money

---

### 2. Maya (PayMaya) API Setup

#### Sign Up
1. Go to https://developers.paymaya.com/
2. Register for developer account
3. Verify email

#### Get API Keys
1. Login to Maya Developer Dashboard
2. Go to "API Keys"
3. Copy:
   - Public Key (for checkout)
   - Secret Key (for verification)
4. Add to `.env`:
```env
MAYA_PUBLIC_KEY="pk-test-xxxxx"
MAYA_SECRET_KEY="sk-test-xxxxx"
MAYA_API_URL="https://pg-sandbox.paymaya.com"
MAYA_ENVIRONMENT="sandbox"
```

#### Configure Webhooks
1. In Maya Dashboard → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/maya/webhook`
3. Subscribe to events:
   - CHECKOUT_SUCCESS
   - CHECKOUT_FAILURE
   - PAYMENT_SUCCESS

---

### 3. Semaphore SMS API Setup

#### Sign Up
1. Go to https://semaphore.co/
2. Click "Sign Up" → Register
3. Verify email

#### Get API Key
1. Login to Semaphore dashboard
2. Go to "API" section
3. Copy your API Key
4. Add to `.env`:
```env
SEMAPHORE_API_KEY="your-api-key-here"
SEMAPHORE_SENDER_NAME="PHFoodDel"
```

#### Load Credits
1. Go to "Buy Load"
2. Start with ₱100 (200 SMS)
3. Payment via GCash, PayPal, or bank transfer

#### Test SMS
```bash
# In Node.js console or create test file
import semaphoreService from './src/services/semaphore.service.js';

await semaphoreService.sendSMS('+639171234567', 'Test message from PH Food Delivery');
```

---

### 4. Google Maps Platform Setup

#### Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create new project: "PH Food Delivery"
3. Enable billing (FREE tier: $200/month credit)

#### Enable Required APIs
In Google Cloud Console → APIs & Services → Library, enable:
- ✅ Maps JavaScript API
- ✅ Directions API
- ✅ Distance Matrix API
- ✅ Places API
- ✅ Geocoding API

#### Create API Key
1. Go to "Credentials" → "Create Credentials" → "API Key"
2. Copy the API key
3. Click "Restrict Key":
   - **Application restrictions**: HTTP referrers
   - **Add referrer**: `localhost:3000/*`, `yourdomain.com/*`
   - **API restrictions**: Select the 5 APIs enabled above
4. Add to `.env`:
```env
GOOGLE_MAPS_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX"
GOOGLE_MAPS_DIRECTIONS_API_ENABLED=true
GOOGLE_MAPS_DISTANCE_MATRIX_ENABLED=true
```

#### Test Maps
Visit: http://localhost:3000/test-maps

---

### 5. Firebase Setup (Push Notifications)

#### Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name: "PH Food Delivery"
4. Disable Google Analytics (optional)

#### Enable Cloud Messaging
1. In Firebase Console → Build → Cloud Messaging
2. Click "Get Started"
3. Add web app (for customer notifications)
4. Add Android/iOS apps (for driver app)

#### Get Credentials
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Add to `.env`:
```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXX..."
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com"
FIREBASE_DATABASE_URL="https://your-project.firebaseio.com"
```

---

### 6. SendGrid Email Setup (Optional)

#### Sign Up
1. Go to https://sendgrid.com/
2. Sign up (FREE: 100 emails/day)
3. Verify email

#### Create API Key
1. Go to Settings → API Keys
2. Create API Key with "Full Access"
3. Copy key (shown only once!)
4. Add to `.env`:
```env
SENDGRID_API_KEY="SG.xxxxx"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="PH Food Delivery"
```

#### Verify Sender
1. Go to Settings → Sender Authentication
2. Verify your email address or domain

---

## Database Setup

### Understanding the Schema

The platform uses 14 main tables:

1. **User** - Customers, restaurant owners, drivers, admins
2. **Restaurant** - Restaurant details, location, hours
3. **MenuItem** - Menu with Filipino translations
4. **MenuCustomization** - Add-ons (extra rice, cheese, etc.)
5. **Order** - Order details, status, payments
6. **OrderItem** - Individual items in order
7. **Driver** - Driver profiles, vehicle info
8. **DriverEarning** - Driver payment tracking
9. **Tracking** - Real-time GPS coordinates
10. **Transaction** - Payment records
11. **Settlement** - Restaurant/driver payouts
12. **Review** - Customer ratings & reviews
13. **PromoCode** - Discount codes
14. **Notification** - SMS/push/email logs

### View Schema
```bash
npx prisma studio
```
This opens a web GUI at http://localhost:5555 to browse data.

### Reset Database (if needed)
```bash
npx prisma migrate reset
npm run db:seed
```

---

## Testing

### Manual Testing Checklist

#### 1. Test User Registration
- [ ] Register as customer
- [ ] Verify SMS OTP received
- [ ] Complete verification
- [ ] Login successfully

#### 2. Test Restaurant Browsing
- [ ] View restaurant list
- [ ] Filter by city/cuisine
- [ ] Click restaurant → View menu
- [ ] See prices in pesos (₱)

#### 3. Test Order Placement
- [ ] Add items to cart
- [ ] Add customizations
- [ ] Enter delivery address
- [ ] See delivery fee calculated
- [ ] Apply promo code
- [ ] See correct commission breakdown

#### 4. Test Payment Flow
**GCash:**
- [ ] Select GCash payment
- [ ] Redirect to GCash checkout
- [ ] Complete payment (sandbox)
- [ ] Receive confirmation SMS
- [ ] Order status = CONFIRMED

**Maya:**
- [ ] Select Maya payment
- [ ] Complete checkout
- [ ] Verify payment webhook received

#### 5. Test Driver Assignment
- [ ] Restaurant accepts order
- [ ] System finds nearest driver
- [ ] Driver receives SMS notification
- [ ] Driver accepts delivery
- [ ] Customer sees driver info

#### 6. Test Real-Time Tracking
- [ ] Open tracking page
- [ ] See Google Maps with markers
- [ ] Driver updates location
- [ ] Map updates in real-time
- [ ] ETA displayed correctly

#### 7. Test Delivery Flow
- [ ] Driver marks "Picked up"
- [ ] Status updates sent via SMS
- [ ] Driver marks "Delivered"
- [ ] Customer receives rating request

#### 8. Test Settlements
- [ ] Commission calculated correctly
- [ ] Restaurant settlement scheduled
- [ ] Driver earnings recorded
- [ ] Payout processes next day

### Automated Testing (Future Enhancement)
```bash
npm test
```

---

## Production Deployment

### Option 1: Deploy to Railway (Recommended for Philippines)

#### Why Railway?
- Philippines-friendly payment methods
- Automatic HTTPS
- Easy database hosting
- Affordable pricing

#### Steps:
1. **Sign up**: https://railway.app/
2. **Install CLI**:
```bash
npm install -g @railway/cli
railway login
```

3. **Initialize project**:
```bash
railway init
```

4. **Add MySQL database**:
```bash
railway add mysql
```

5. **Set environment variables**:
```bash
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=${{DATABASE_URL}}
# Add all other .env variables
```

6. **Deploy**:
```bash
railway up
```

7. **Run migrations**:
```bash
railway run npx prisma migrate deploy
railway run npm run db:seed
```

Your app is now live at: `https://your-app.up.railway.app`

---

### Option 2: Deploy to DigitalOcean (More control)

#### Create Droplet
1. Sign up at https://www.digitalocean.com/
2. Create Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month)
   - **Region**: Singapore (closest to Philippines)

#### SSH into Server
```bash
ssh root@your-droplet-ip
```

#### Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server
mysql_secure_installation

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
apt install -y nginx
```

#### Setup Application
```bash
# Clone repository
cd /var/www
git clone https://github.com/your-repo/food-delivery-ph.git
cd food-delivery-ph

# Install dependencies
npm install --production

# Create .env file
nano .env
# Paste all production environment variables

# Run migrations
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

#### Configure Nginx
```bash
nano /etc/nginx/sites-available/food-delivery
```

Paste:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/food-delivery /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Start Application with PM2
```bash
pm2 start server.js --name food-delivery
pm2 save
pm2 startup
```

#### Setup SSL (HTTPS)
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

Your app is now live at: `https://yourdomain.com`

---

## Monitoring & Maintenance

### Daily Tasks
- [ ] Check server logs: `pm2 logs food-delivery`
- [ ] Monitor active orders
- [ ] Review error reports
- [ ] Check SMS balance (Semaphore)

### Weekly Tasks
- [ ] Review platform analytics
- [ ] Process pending settlements
- [ ] Check database backup status
- [ ] Update dependencies: `npm update`

### Monthly Tasks
- [ ] Review API costs (Google Maps, GCash, etc.)
- [ ] Optimize database (remove old data)
- [ ] Security audit
- [ ] User feedback review

### Automated Monitoring
```bash
# Set up PM2 monitoring (free)
pm2 install pm2-server-monit

# Check server status
pm2 status
pm2 monit
```

### Database Backups
```bash
# Backup database daily
crontab -e
```

Add:
```cron
0 2 * * * mysqldump -u root -p food_delivery_ph > /backups/db-$(date +\%Y\%m\%d).sql
```

---

## Troubleshooting

### Issue: "Cannot connect to database"
**Solution:**
```bash
# Check MySQL running
systemctl status mysql

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection
npx prisma db push
```

### Issue: "GCash payment failing"
**Solution:**
- Verify API credentials in .env
- Check GCash dashboard for errors
- Ensure using sandbox mode for testing
- Check callback URL is accessible

### Issue: "SMS not sending"
**Solution:**
- Check Semaphore balance: https://semaphore.co/
- Verify API key is correct
- Test phone number format (+639XXXXXXXXX)
- Check SMS logs in Semaphore dashboard

### Issue: "Google Maps not loading"
**Solution:**
- Check API key restrictions
- Verify billing enabled (required for Maps API)
- Check browser console for errors
- Ensure all 5 APIs are enabled

### Issue: "Driver location not updating"
**Solution:**
- Check Socket.IO connection:
```javascript
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
```
- Verify driver location update interval (10 seconds)
- Check server logs for errors

### Issue: "High server CPU usage"
**Solution:**
- Check PM2 monitoring: `pm2 monit`
- Review slow database queries
- Enable Redis caching (future enhancement)
- Scale to multiple servers

### Common Errors

**Error**: `Prisma migrate not found`
```bash
npm install prisma --save-dev
npx prisma migrate dev
```

**Error**: `Port 3000 already in use`
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

**Error**: `Session secret required`
```bash
# Add to .env
SESSION_SECRET="$(openssl rand -base64 32)"
```

---

## Support & Resources

### Documentation
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) - System design
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [README.md](./README.md) - Project overview

### External Documentation
- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/)
- [Socket.IO Docs](https://socket.io/docs/)
- [GCash API Docs](https://developer.gcash.com/docs)
- [Maya API Docs](https://developers.paymaya.com/)
- [Google Maps API](https://developers.google.com/maps)

### Community
- **Issues**: https://github.com/your-repo/issues
- **Discussions**: https://github.com/your-repo/discussions
- **Email**: support@yourcompany.com

---

## Next Steps

After completing setup:

1. **Customize Branding**
   - Update logo and colors in `public/css/style.css`
   - Change platform name in `.env` (PLATFORM_NAME)

2. **Add More Restaurants**
   - Register restaurant accounts
   - Add menus and pricing
   - Set delivery zones

3. **Onboard Drivers**
   - Register driver accounts
   - Verify vehicle documents
   - Provide training

4. **Launch Marketing**
   - Create promo codes for first users
   - Set up social media
   - Partner with local restaurants

5. **Monitor & Optimize**
   - Track key metrics
   - Gather user feedback
   - Optimize delivery routes

---

🎉 **Congratulations!** Your Philippines Food Delivery Platform is ready to serve customers!

For questions or support, contact: support@yourcompany.com

# API Services Used in PH Food Delivery Platform

Complete list of all external APIs integrated in the platform, with setup instructions and costs.

---

## 🎯 **Required APIs (Must Have)**

These are essential for the platform to function.

### 1. **PayPal API** (Payment Processing)
- **Purpose**: Process customer payments and restaurant/driver payouts
- **Cost**: FREE for sandbox testing, 3.4% + ₱15 per transaction in production
- **Sign Up**: https://developer.paypal.com/
- **What You Need**:
  - Client ID
  - Client Secret

**Setup Steps**:
1. Go to https://developer.paypal.com/
2. Sign in with your PayPal account
3. Go to "My Apps & Credentials"
4. Create "Sandbox App" (for testing) or "Live App" (for production)
5. Copy **Client ID** and **Secret**
6. Add to `.env`:
```env
PAYPAL_CLIENT_ID="your-client-id"
PAYPAL_CLIENT_SECRET="your-client-secret"
PAYPAL_MODE="sandbox"  # or "live" for production
```

**API Features Used**:
- ✅ Create payment orders
- ✅ Capture payments
- ✅ Process refunds
- ✅ Payout to restaurants/drivers (PayPal balance)
- ✅ Transaction history

**Documentation**: https://developer.paypal.com/api/rest/

---

### 2. **Google Maps Platform** (Location & Navigation)
- **Purpose**: Maps, routing, distance calculation, geocoding
- **Cost**: FREE ($200 monthly credit, covers ~28,000 map loads)
- **Sign Up**: https://console.cloud.google.com/
- **What You Need**:
  - Single API Key (used for all 5 APIs below)

**5 Google APIs Used**:

#### a) **Maps JavaScript API**
- Display interactive maps on website
- Show restaurant locations
- Real-time driver tracking map

#### b) **Directions API**
- Get turn-by-turn directions
- Calculate routes from driver → restaurant → customer
- Traffic-aware routing

#### c) **Distance Matrix API**
- Calculate distances between multiple points
- Find nearest driver to restaurant
- Estimate delivery time

#### d) **Geocoding API**
- Convert addresses to coordinates
- Validate delivery addresses

#### e) **Places API**
- Address autocomplete
- Restaurant location search

**Setup Steps**:
1. Go to https://console.cloud.google.com/
2. Create a new project: "PH Food Delivery"
3. Enable billing (required even for free tier)
4. Go to "APIs & Services" → "Library"
5. Enable these 5 APIs (search each one):
   - Maps JavaScript API
   - Directions API
   - Distance Matrix API
   - Geocoding API
   - Places API
6. Go to "Credentials" → "Create Credentials" → "API Key"
7. Copy the API key
8. **Restrict the key** (important for security):
   - Application restrictions: HTTP referrers
   - Add: `localhost:3000/*`, `yourdomain.com/*`
   - API restrictions: Select the 5 APIs above
9. Add to `.env`:
```env
GOOGLE_MAPS_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX"
GOOGLE_MAPS_DIRECTIONS_API_ENABLED=true
GOOGLE_MAPS_DISTANCE_MATRIX_ENABLED=true
```

**Monthly Usage Estimates** (1,000 orders):
- Maps loads: ~3,000 (customers viewing restaurants)
- Directions API: ~1,000 (one per order)
- Distance Matrix: ~500 (driver matching)
- Total cost: **$0** (within free tier)

**Documentation**: https://developers.google.com/maps/documentation

---

## 📱 **Optional APIs (Recommended)**

These enhance the platform but aren't strictly required.

### 3. **Semaphore SMS API** (Philippines SMS)
- **Purpose**: Send SMS notifications (OTP, order updates)
- **Cost**: ₱0.50 per SMS
- **Sign Up**: https://semaphore.co/
- **What You Need**:
  - API Key
  - Sender Name (11 characters max)

**Setup Steps**:
1. Go to https://semaphore.co/
2. Register account (free)
3. Verify email and phone
4. Go to "API" section
5. Copy your **API Key**
6. Buy SMS credits (minimum ₱100 = 200 SMS)
7. Add to `.env`:
```env
SEMAPHORE_API_KEY="your-api-key"
SEMAPHORE_SENDER_NAME="PHFoodDel"
```

**SMS Usage** (per order):
- 1 SMS to restaurant (new order alert)
- 1 SMS to customer (order confirmed)
- 1 SMS to driver (delivery assignment)
- Total: **3 SMS × ₱0.50 = ₱1.50 per order**

**Monthly Cost** (1,000 orders): ₱1,500

**Alternative**: Twilio (more expensive for Philippines)

**Documentation**: https://semaphore.co/docs

---

### 4. **Firebase Cloud Messaging** (Push Notifications)
- **Purpose**: Send push notifications to mobile apps (customer, driver)
- **Cost**: FREE (unlimited)
- **Sign Up**: https://console.firebase.google.com/
- **What You Need**:
  - Project ID
  - Private Key
  - Client Email
  - Database URL

**Setup Steps**:
1. Go to https://console.firebase.google.com/
2. Create new project: "PH Food Delivery"
3. Skip Google Analytics (optional)
4. Go to Project Settings → Cloud Messaging
5. Add web app / Android / iOS apps
6. Go to "Service Accounts"
7. Click "Generate new private key"
8. Download JSON file
9. Extract values and add to `.env`:
```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXX..."
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com"
FIREBASE_DATABASE_URL="https://your-project.firebaseio.com"
```

**Features**:
- Push notifications to customer app
- Push notifications to driver app
- Real-time order updates

**Monthly Cost**: **FREE**

**Documentation**: https://firebase.google.com/docs/cloud-messaging

---

### 5. **SendGrid Email API** (Email Notifications)
- **Purpose**: Send order receipts, password resets via email
- **Cost**: FREE (100 emails/day)
- **Sign Up**: https://sendgrid.com/
- **What You Need**:
  - API Key
  - Verified sender email

**Setup Steps**:
1. Go to https://sendgrid.com/
2. Sign up (free tier: 100 emails/day)
3. Verify your email
4. Go to Settings → API Keys
5. Create API Key with "Full Access"
6. Copy key (shown only once!)
7. Go to Settings → Sender Authentication
8. Verify your email address or domain
9. Add to `.env`:
```env
SENDGRID_API_KEY="SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="PH Food Delivery"
```

**Email Usage** (per order):
- 1 email receipt to customer
- 1 email to restaurant (optional)
- Total: ~1-2 emails per order

**Monthly Cost** (1,000 orders): **FREE** (within 100/day limit)

**Documentation**: https://docs.sendgrid.com/

---

## 🗄️ **Database** (Required)

### MySQL Database
- **Purpose**: Store all platform data (users, orders, restaurants, etc.)
- **Cost**:
  - Local (development): FREE
  - Cloud options:
    - Railway: ~₱1,500/month
    - DigitalOcean: ~₱500/month
    - AWS RDS: ~₱2,000/month

**Setup**:
- Local: Install MySQL 8.0+
- Cloud: Use managed database service

```env
DATABASE_URL="mysql://root:password@localhost:3306/food_delivery_ph"
```

---

## 📊 **Complete Cost Breakdown**

### Monthly Costs (1,000 orders/month)

| Service | Cost (₱) | Notes |
|---------|----------|-------|
| **PayPal Fees** | ₱30,000 | 3.4% + ₱15 per transaction (₱1,000 avg order) |
| **Google Maps** | ₱0 | Free tier ($200 credit) |
| **Semaphore SMS** | ₱1,500 | 3 SMS per order × ₱0.50 |
| **Firebase FCM** | ₱0 | Free unlimited |
| **SendGrid Email** | ₱0 | Free tier (100/day) |
| **MySQL Database** | ₱1,500 | Cloud hosting (Railway) |
| **Server Hosting** | ₱2,000 | Railway/DigitalOcean |
| **TOTAL** | **₱35,000** | |

### Revenue (1,000 orders)
| Item | Amount (₱) |
|------|------------|
| Total Sales (₱1,000 avg) | ₱1,000,000 |
| Platform Commission (18%) | ₱180,000 |
| Infrastructure Costs | -₱35,000 |
| **Net Profit** | **₱145,000** |

---

## 🔧 **Environment Variables Summary**

Here's everything you need in your `.env` file:

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/food_delivery_ph"

# Server
PORT=3000
NODE_ENV=development
SESSION_SECRET="your-random-secret-key"

# Platform Settings
PLATFORM_NAME="PH Food Delivery"
PLATFORM_COMMISSION_RATE=0.18
DEFAULT_CURRENCY="PHP"
DEFAULT_LANGUAGE="en"

# === REQUIRED APIS ===

# PayPal (REQUIRED)
PAYPAL_CLIENT_ID="your-client-id"
PAYPAL_CLIENT_SECRET="your-client-secret"
PAYPAL_MODE="sandbox"

# Google Maps (REQUIRED)
GOOGLE_MAPS_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX"
GOOGLE_MAPS_DIRECTIONS_API_ENABLED=true
GOOGLE_MAPS_DISTANCE_MATRIX_ENABLED=true

# === OPTIONAL APIS ===

# Semaphore SMS (OPTIONAL - for notifications)
SEMAPHORE_API_KEY="your-api-key"
SEMAPHORE_SENDER_NAME="PHFoodDel"

# Firebase (OPTIONAL - for push notifications)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com"
FIREBASE_DATABASE_URL="https://your-project.firebaseio.com"

# SendGrid (OPTIONAL - for emails)
SENDGRID_API_KEY="SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="PH Food Delivery"

# Philippines Settings
SUPPORTED_CITIES="Metro Manila,Quezon City,Manila,Makati,Taguig,Pasig,Cebu City,Davao City"
DEFAULT_DELIVERY_FEE=50
DELIVERY_FEE_PER_KM=10
MAX_DELIVERY_DISTANCE=15
AVERAGE_PREP_TIME=30
```

---

## ✅ **Minimum Setup (Just to Get Started)**

If you want to start quickly with minimal setup:

**Required**:
1. ✅ MySQL Database (local installation - FREE)
2. ✅ PayPal Sandbox Account (FREE)
3. ✅ Google Maps API (FREE tier)

**Add later**:
- Semaphore SMS (when you want real SMS)
- Firebase (when you build mobile apps)
- SendGrid (when you want emails)

---

## 🚀 **API Setup Priority**

### Phase 1: Development (Local Testing)
1. MySQL - Install locally
2. PayPal - Sandbox account
3. Google Maps - Enable 5 APIs

**Result**: Fully functional platform on localhost

### Phase 2: MVP (First Launch)
1. Keep PayPal in sandbox or go live
2. Add Semaphore SMS (for real notifications)
3. Keep Google Maps

**Result**: Can process real orders with SMS notifications

### Phase 3: Scale (Growth)
1. Add Firebase (mobile apps)
2. Add SendGrid (email receipts)
3. Upgrade database to cloud

**Result**: Full-featured platform

---

## 📞 **API Support Links**

| API | Documentation | Support |
|-----|---------------|---------|
| PayPal | https://developer.paypal.com/docs | PayPal Developer Support |
| Google Maps | https://developers.google.com/maps | Google Cloud Support |
| Semaphore | https://semaphore.co/docs | support@semaphore.co |
| Firebase | https://firebase.google.com/docs | Firebase Console |
| SendGrid | https://docs.sendgrid.com | SendGrid Support |

---

## 🔒 **Security Notes**

1. **Never commit API keys to Git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as template

2. **Restrict Google Maps API Key**
   - Set HTTP referrer restrictions
   - Only enable needed APIs

3. **Use Sandbox for Testing**
   - PayPal: Use sandbox mode
   - Test thoroughly before going live

4. **Rotate Keys Regularly**
   - Change API keys every 6 months
   - Use different keys for dev/production

---

## 💡 **Pro Tips**

1. **Start with PayPal Sandbox**: Test everything for free
2. **Google Maps Free Tier**: $200 credit = 28,000 map loads/month
3. **Semaphore**: Buy ₱100 credit first, test SMS
4. **Firebase**: Free for unlimited push notifications
5. **Monitor Usage**: Check API dashboards monthly

---

## ❓ **Common Questions**

**Q: Do I need all these APIs to start?**
A: No! Minimum: MySQL + PayPal + Google Maps. Add others later.

**Q: Are the optional APIs really optional?**
A: Yes! The platform works without them, but user experience is better with SMS/email notifications.

**Q: How much does it really cost to run this?**
A: For 1,000 orders/month: ~₱35,000. But you earn ₱180,000 in commission!

**Q: Can I use free tiers forever?**
A: Google Maps - yes ($200/month credit). Firebase - yes. SendGrid - yes (100 emails/day). Semaphore - no (pay per SMS).

**Q: What if I exceed Google Maps free tier?**
A: You'll be charged, but unlikely with 1,000 orders/month.

---

**Last Updated**: October 2023
**Platform**: PH Food Delivery v1.0.0

For setup instructions, see: `SETUP_GUIDE_PHILIPPINES.md`

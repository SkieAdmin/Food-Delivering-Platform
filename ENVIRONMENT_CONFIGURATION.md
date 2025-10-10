# Environment Configuration Guide

## Overview

All external API URLs are now configurable via environment variables. This allows you to easily switch between development, staging, and production environments, or use self-hosted alternatives.

---

## 📋 Quick Setup

### 1. Copy the Example File

```bash
cp .env.example .env
```

### 2. Configure Your URLs

Edit `.env` and update the URLs as needed:

```bash
# OpenStreetMap APIs
NOMINATIM_BASE_URL="https://nominatim.openstreetmap.org"
OSRM_BASE_URL="https://router.project-osrm.org"
OSM_TILE_URL="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

# MockAPI
MOCKAPI_BASE_URL="https://68e85f93f2707e6128caa838.mockapi.io/order/processor"
```

### 3. Restart Your Server

```bash
npm start
```

---

## 🌍 Environment Variables Reference

### OpenStreetMap Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org` | Geocoding service URL |
| `OSRM_BASE_URL` | `https://router.project-osrm.org` | Routing service URL |
| `OSM_TILE_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Map tiles URL |
| `OSM_USER_AGENT` | `PH-Food-Delivery-Platform/1.0` | User agent for API requests |

### MockAPI Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MOCKAPI_BASE_URL` | `https://68e85f93f2707e6128caa838.mockapi.io/order/processor` | Order processor API |
| `MOCKAPI_TIMEOUT` | `10000` | Request timeout in milliseconds |

### Other APIs

| Variable | Required | Description |
|----------|----------|-------------|
| `PAYPAL_CLIENT_ID` | ✅ Yes | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | ✅ Yes | PayPal client secret |
| `PAYPAL_MODE` | No | `sandbox` or `production` |

---

## 🏗️ Self-Hosting Examples

### Option 1: Self-Hosted OSRM (Routing)

**Docker Setup:**

```bash
# Download Philippines map data
wget http://download.geofabrik.de/asia/philippines-latest.osm.pbf

# Process the data
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/philippines-latest.osm.pbf
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-partition /data/philippines-latest.osrm
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-customize /data/philippines-latest.osrm

# Run the server
docker run -t -i -p 5000:5000 -v "${PWD}:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/philippines-latest.osrm
```

**Update `.env`:**

```bash
OSRM_BASE_URL="http://localhost:5000"
```

---

### Option 2: Self-Hosted Nominatim (Geocoding)

**Docker Setup:**

```bash
# Run Nominatim with Philippines data
docker run -it \
  -e PBF_URL=https://download.geofabrik.de/asia/philippines-latest.osm.pbf \
  -e REPLICATION_URL=https://download.geofabrik.de/asia/philippines-updates/ \
  -p 8080:8080 \
  --name nominatim \
  mediagis/nominatim:4.2
```

**Update `.env`:**

```bash
NOMINATIM_BASE_URL="http://localhost:8080"
```

---

### Option 3: Custom Tile Server

**Using TileServer GL:**

```bash
# Download Philippines map data
wget https://data.maptiler.com/downloads/dataset/osm/asia/philippines/

# Run tile server
docker run -it -v $(pwd):/data -p 8081:8080 maptiler/tileserver-gl
```

**Update `.env`:**

```bash
OSM_TILE_URL="http://localhost:8081/styles/osm-bright/{z}/{x}/{y}.png"
```

---

## 🔄 Using Commercial Alternatives

### Mapbox (OSM-based)

```bash
# Get API key from https://account.mapbox.com/
OSRM_BASE_URL="https://api.mapbox.com/directions/v5/mapbox"
OSM_TILE_URL="https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=YOUR_TOKEN"
```

### LocationIQ (Nominatim-based)

```bash
# Get API key from https://locationiq.com/
NOMINATIM_BASE_URL="https://us1.locationiq.com/v1"
```

### Stadia Maps

```bash
# Get API key from https://stadiamaps.com/
OSM_TILE_URL="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=YOUR_KEY"
```

---

## 🧪 Testing Different Configurations

### Development Environment

```bash
# .env.development
NOMINATIM_BASE_URL="https://nominatim.openstreetmap.org"
OSRM_BASE_URL="https://router.project-osrm.org"
MOCKAPI_BASE_URL="https://68e85f93f2707e6128caa838.mockapi.io/order/processor"
```

### Staging Environment

```bash
# .env.staging
NOMINATIM_BASE_URL="http://staging-nominatim.yourcompany.com"
OSRM_BASE_URL="http://staging-osrm.yourcompany.com"
MOCKAPI_BASE_URL="https://staging-api.yourcompany.com/orders"
```

### Production Environment

```bash
# .env.production
NOMINATIM_BASE_URL="http://nominatim.yourcompany.com"
OSRM_BASE_URL="http://osrm.yourcompany.com"
MOCKAPI_BASE_URL="https://api.yourcompany.com/orders"
```

---

## 📊 How It Works

### Backend Services

All backend services read from environment variables:

```javascript
// src/services/maps.service.js
constructor() {
  this.nominatimBaseUrl = process.env.NOMINATIM_BASE_URL || 'default';
  this.osrmBaseUrl = process.env.OSRM_BASE_URL || 'default';
}

// src/services/mockapi.service.js
constructor() {
  this.baseURL = process.env.MOCKAPI_BASE_URL || 'default';
}
```

### Frontend Views

Config is passed to EJS templates via `res.locals.config`:

```javascript
// server.js
app.use((req, res, next) => {
  res.locals.config = config;
  next();
});
```

Then accessed in views:

```javascript
// In EJS templates
const tileUrl = '<%= config.openStreetMap.tileUrl %>';
const nominatimUrl = '<%= config.openStreetMap.nominatimBaseUrl %>';
```

---

## ✅ Advantages of This Approach

1. **Flexibility** - Easy to switch between services
2. **Security** - URLs not hardcoded in source code
3. **Testing** - Different configs for dev/staging/prod
4. **Self-Hosting** - Use your own infrastructure
5. **Cost Control** - Switch to commercial providers with higher limits
6. **Version Control** - `.env` files excluded from git

---

## 🔐 Security Best Practices

### 1. Never Commit `.env` Files

Your `.gitignore` should include:

```
.env
.env.local
.env.*.local
```

### 2. Use Different Keys Per Environment

```bash
# Development
MOCKAPI_BASE_URL="https://dev.mockapi.io/..."

# Production
MOCKAPI_BASE_URL="https://api.production.com/..."
```

### 3. Validate Environment Variables

The code includes fallback defaults:

```javascript
const url = process.env.API_URL || 'https://default-url.com';
```

---

## 🐛 Troubleshooting

### Issue: API Not Using .env Values

**Solution:**
1. Ensure `.env` file is in project root
2. Restart the server after editing `.env`
3. Check for typos in variable names

### Issue: Frontend Shows Default URLs

**Solution:**
1. Check that `config` is passed to views in `server.js`
2. Verify EJS syntax: `<%= config.openStreetMap.tileUrl %>`
3. Clear browser cache

### Issue: Self-Hosted Service Not Working

**Solution:**
1. Verify Docker container is running: `docker ps`
2. Check port mappings match `.env` configuration
3. Test endpoint directly: `curl http://localhost:5000/...`

---

## 📝 Example: Complete `.env` File

```bash
# === DATABASE ===
DATABASE_URL="mysql://root:password@localhost:3306/food_delivery_ph"

# === SERVER ===
PORT=3000
NODE_ENV=development
SESSION_SECRET="your-random-secret-key-here"

# === PLATFORM SETTINGS ===
PLATFORM_NAME="PH Food Delivery"
PLATFORM_COMMISSION_RATE=0.18
DEFAULT_CURRENCY="PHP"
DEFAULT_DELIVERY_FEE=50
DELIVERY_FEE_PER_KM=10
MAX_DELIVERY_DISTANCE=15

# === REQUIRED APIs ===
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_MODE="sandbox"

# === OPENSTREETMAP APIs ===
NOMINATIM_BASE_URL="https://nominatim.openstreetmap.org"
OSRM_BASE_URL="https://router.project-osrm.org"
OSM_TILE_URL="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
OSM_USER_AGENT="PH-Food-Delivery-Platform/1.0"

# === MOCKAPI ===
MOCKAPI_BASE_URL="https://68e85f93f2707e6128caa838.mockapi.io/order/processor"
MOCKAPI_TIMEOUT=10000

# === OPTIONAL APIs ===
SEMAPHORE_API_KEY="your-semaphore-api-key"
SEMAPHORE_SENDER_NAME="PHFoodDel"
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@phfooddelivery.com"
```

---

## 🎯 Summary

All API URLs are now configurable via `.env`:

- ✅ **OpenStreetMap** (Nominatim, OSRM, Tiles)
- ✅ **MockAPI.io**
- ✅ **PayPal**
- ✅ **Other services**

This makes your platform:
- **Flexible** - Switch providers easily
- **Scalable** - Self-host when needed
- **Professional** - Production-ready configuration management

No more hardcoded URLs! 🎉

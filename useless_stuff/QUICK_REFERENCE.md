# Quick Reference Guide - PH Food Delivery Platform

Essential commands and configurations for daily operations.

---

## 🚀 Quick Start (First Time)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Create database
mysql -u root -p
CREATE DATABASE food_delivery_ph;
EXIT;

# 4. Run migrations
npx prisma generate
npx prisma migrate dev

# 5. Seed sample data
npm run db:seed

# 6. Start server
npm run dev

# Visit: http://localhost:3000
```

---

## 📝 Daily Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# View database in browser
npx prisma studio
# Opens http://localhost:5555

# Check database status
npx prisma db push

# View server logs (production)
pm2 logs food-delivery

# Restart server (production)
pm2 restart food-delivery
```

---

## 🗄️ Database Commands

```bash
# Create new migration
npx prisma migrate dev --name description

# Reset database (CAUTION: Deletes all data!)
npx prisma migrate reset

# Seed database
npm run db:seed

# Backup database
mysqldump -u root -p food_delivery_ph > backup.sql

# Restore database
mysql -u root -p food_delivery_ph < backup.sql

# Generate Prisma client
npx prisma generate
```

---

## 🔑 Test Accounts (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@test.com | password123 |
| Restaurant | jollibee@test.com | password123 |
| Driver | driver@test.com | password123 |
| Admin | admin@test.com | password123 |

---

## 🌐 API Endpoints Cheat Sheet

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-otp
POST /api/auth/logout
```

### Restaurants
```
GET  /api/restaurants
GET  /api/restaurants/:id
POST /api/restaurants/:id/estimate
```

### Orders
```
POST  /api/orders
GET   /api/orders/:id
PATCH /api/orders/:id/status
POST  /api/orders/:id/cancel
```

### Payments
```
POST /api/payments/gcash
POST /api/payments/maya
POST /api/payments/verify
```

### Tracking
```
GET  /api/tracking/:orderId
POST /api/tracking/driver-location
```

---

## 💳 Payment Gateway Quick Test

### GCash (Sandbox)
```javascript
// Use test credentials from GCash Developer Portal
// No real money charged
```

### Maya (Sandbox)
```javascript
// Test card numbers:
// VISA: 4111 1111 1111 1111
// Mastercard: 5555 5555 5555 4444
// CVV: Any 3 digits
// Expiry: Any future date
```

---

## 📱 SMS Testing (Semaphore)

```javascript
import semaphoreService from './src/services/semaphore.service.js';

// Send test SMS
await semaphoreService.sendSMS('+639171234567', 'Test message');

// Check balance
await semaphoreService.checkBalance();
```

---

## 🗺️ Google Maps Testing

```javascript
import googleMapsService from './src/services/maps.service.js';

// Get directions
const route = await googleMapsService.getDirections(
  { lat: 14.5547, lng: 120.9929 },
  { lat: 14.5995, lng: 120.9842 }
);

// Calculate delivery fee
const fee = googleMapsService.calculateDeliveryFee(3.5); // ₱85
```

---

## 💰 Commission Calculation

```javascript
import settlementService from './src/services/settlement.service.js';

const breakdown = settlementService.calculateCommission({
  subtotal: 450,    // ₱450
  deliveryFee: 50,  // ₱50
  discount: 0
});

// Result:
// {
//   platformFee: 81,       // 18% of ₱450
//   restaurantAmount: 369, // ₱450 - ₱81
//   driverAmount: 50,      // Full delivery fee
//   totalAmount: 500       // Customer pays ₱500
// }
```

---

## 🚗 Driver Assignment Test

```javascript
import driverAssignmentService from './src/services/driver-assignment.service.js';

// Auto-assign best driver to order
const result = await driverAssignmentService.assignDriverToOrder(5001);

// Returns:
// {
//   success: true,
//   driver: { id, name, phone, rating },
//   estimatedArrival: 8,
//   deliveryFee: 85
// }
```

---

## 🔧 Environment Variables Quick Reference

### Required (Minimum)
```env
DATABASE_URL="mysql://root:password@localhost:3306/food_delivery_ph"
SESSION_SECRET="random-secret-key"
PORT=3000
```

### Payment Gateways
```env
# GCash
GCASH_APP_ID="your-id"
GCASH_APP_SECRET="your-secret"
GCASH_MERCHANT_ID="your-merchant-id"

# Maya
MAYA_PUBLIC_KEY="pk-test-xxxxx"
MAYA_SECRET_KEY="sk-test-xxxxx"
```

### SMS
```env
SEMAPHORE_API_KEY="your-api-key"
SEMAPHORE_SENDER_NAME="PHFoodDel"
```

### Maps
```env
GOOGLE_MAPS_API_KEY="AIzaSy..."
```

### Platform Settings
```env
PLATFORM_COMMISSION_RATE=0.18     # 18%
DEFAULT_DELIVERY_FEE=50           # ₱50
DELIVERY_FEE_PER_KM=10            # ₱10/km
MAX_DELIVERY_DISTANCE=15          # 15km
```

---

## 📊 Common Database Queries

```sql
-- Count total orders today
SELECT COUNT(*) FROM `Order`
WHERE DATE(createdAt) = CURDATE();

-- Total revenue today
SELECT SUM(totalAmount) FROM `Order`
WHERE DATE(createdAt) = CURDATE()
AND paymentStatus = 'COMPLETED';

-- Active orders
SELECT * FROM `Order`
WHERE status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY');

-- Top restaurants by orders
SELECT r.name, COUNT(o.id) as orders
FROM Restaurant r
LEFT JOIN `Order` o ON r.id = o.restaurantId
GROUP BY r.id
ORDER BY orders DESC
LIMIT 10;

-- Driver earnings today
SELECT d.id, u.firstName, SUM(de.amount) as earnings
FROM Driver d
JOIN User u ON d.userId = u.id
JOIN DriverEarning de ON d.id = de.driverId
WHERE DATE(de.createdAt) = CURDATE()
GROUP BY d.id;
```

---

## 🐛 Troubleshooting Quick Fixes

### Server won't start
```bash
# Check if port is in use
lsof -i :3000
# Kill process
kill -9 <PID>
# Or use different port
PORT=3001 npm run dev
```

### Database connection error
```bash
# Verify MySQL is running
systemctl status mysql

# Test connection
npx prisma db push

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Prisma errors
```bash
# Regenerate client
npx prisma generate

# Reset and reseed
npx prisma migrate reset
npm run db:seed
```

### SMS not sending
```bash
# Check Semaphore balance
# Login to https://semaphore.co/

# Test API key
curl -X POST https://api.semaphore.co/api/v4/messages \
  -d apikey=YOUR_API_KEY \
  -d number=+639171234567 \
  -d message="Test"
```

### Payment gateway errors
```bash
# Verify in .env:
# - API keys are correct
# - Using sandbox mode for testing
# - Callback URLs are accessible

# Check logs
pm2 logs food-delivery
```

---

## 📈 Monitoring Commands

```bash
# View real-time server stats
pm2 monit

# Check server status
pm2 status

# View server logs
pm2 logs food-delivery --lines 100

# Check database size
mysql -u root -p -e "
SELECT
  table_schema as 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'food_delivery_ph';
"

# Check disk space
df -h

# Check memory usage
free -h
```

---

## 🔒 Security Checklist

- [ ] Change SESSION_SECRET in .env
- [ ] Use strong MySQL root password
- [ ] Enable HTTPS in production
- [ ] Restrict Google Maps API key
- [ ] Never commit .env to git
- [ ] Enable firewall on server
- [ ] Keep dependencies updated (`npm update`)
- [ ] Enable MySQL slow query log
- [ ] Set up automated backups
- [ ] Use environment-specific API keys

---

## 📞 Support Links

- **Documentation**: See project root files
- **GCash**: https://developer.gcash.com/
- **Maya**: https://developers.paymaya.com/
- **Semaphore**: https://semaphore.co/
- **Google Maps**: https://console.cloud.google.com/
- **Firebase**: https://console.firebase.google.com/
- **Prisma**: https://www.prisma.io/docs

---

## 🎯 Performance Benchmarks

| Metric | Target | Command to Check |
|--------|--------|------------------|
| Order placement | < 2s | Check logs |
| Driver assignment | < 5s | Check logs |
| Map loading | < 3s | Browser DevTools |
| Real-time updates | < 1s | Socket.IO monitoring |
| Database queries | < 100ms | `npx prisma studio` |

---

## 📦 Deployment Quick Commands

### Railway
```bash
railway login
railway init
railway add mysql
railway up
```

### DigitalOcean
```bash
ssh root@your-droplet-ip
cd /var/www/food-delivery-ph
git pull
npm install
npx prisma generate
npx prisma migrate deploy
pm2 restart food-delivery
```

---

## 🔄 Backup & Restore

```bash
# Automated daily backup (add to cron)
0 2 * * * mysqldump -u root -p food_delivery_ph > /backups/db-$(date +\%Y\%m\%d).sql

# Manual backup
mysqldump -u root -p food_delivery_ph > backup-$(date +\%Y\%m\%d).sql

# Restore from backup
mysql -u root -p food_delivery_ph < backup-20231015.sql
```

---

## 💡 Pro Tips

1. **Use PM2 for production**: Auto-restart on crashes
2. **Enable MySQL slow query log**: Optimize performance
3. **Set up Redis caching**: Future enhancement for speed
4. **Monitor API costs**: Check Google Maps usage
5. **Test in sandbox first**: All payment gateways
6. **Keep SMS balance topped up**: Check Semaphore daily
7. **Backup before migrations**: Always!
8. **Use Prisma Studio**: Easy database browsing
9. **Log everything**: Helps debugging
10. **Test with real Philippine numbers**: For SMS

---

**Last Updated**: October 2023
**Platform Version**: 1.0.0

For detailed information, see:
- SETUP_GUIDE_PHILIPPINES.md
- API_DOCUMENTATION.md
- SYSTEM_ARCHITECTURE.md

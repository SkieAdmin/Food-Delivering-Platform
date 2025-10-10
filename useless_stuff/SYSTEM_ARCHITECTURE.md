# PH Food Delivery Platform - System Architecture

## Overview
A full-stack food delivery platform built specifically for the Philippines market, featuring real-time order tracking, automated driver assignment, and integrated payment processing with GCash, Maya, and PayPal.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐│
│  │  Customer   │  │ Restaurant  │  │   Driver    │  │   Admin    ││
│  │  Web App    │  │  Dashboard  │  │  Mobile App │  │  Dashboard ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘│
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                                 │                                    │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼────────────────────────────────────┐
│                        APPLICATION LAYER                              │
├─────────────────────────────────┼────────────────────────────────────┤
│                                                                       │
│                      Express.js Server                                │
│                      (Node.js + ES6)                                  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    API Routes                                    │ │
│  │  /api/auth  /api/orders  /api/restaurants  /api/tracking       │ │
│  │  /api/payments  /api/settlements  /api/reviews                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                 │                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                  Business Logic Layer                           │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐│ │
│  │  │   Order      │  │   Driver     │  │     Settlement       ││ │
│  │  │ Controller   │  │ Assignment   │  │   & Commission       ││ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘│ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐│ │
│  │  │   Payment    │  │  Restaurant  │  │    Notification      ││ │
│  │  │   Service    │  │   Service    │  │      Service         ││ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘│ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼────────────────────────────────────┐
│                         SERVICE LAYER                                 │
├─────────────────────────────────┼────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐│
│  │   GCash     │  │    Maya     │  │   PayPal    │  │  Semaphore ││
│  │   Service   │  │   Service   │  │   Service   │  │  SMS API   ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘│
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐│
│  │ Google Maps │  │  Firebase   │  │  SendGrid   │  │  Socket.IO ││
│  │     API     │  │   (FCM)     │  │   Email     │  │  Real-time ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘│
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼────────────────────────────────────┐
│                         DATA LAYER                                    │
├─────────────────────────────────┼────────────────────────────────────┤
│                                                                       │
│                    Prisma ORM Layer                                   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   MySQL Database                              │  │
│  │                                                                │  │
│  │  Tables:                                                       │  │
│  │  • Users (Customer, Restaurant, Driver, Admin)                │  │
│  │  • Restaurants (Menu, Location, Hours)                        │  │
│  │  • Orders (Status, Payment, Delivery)                         │  │
│  │  • Tracking (Real-time location)                              │  │
│  │  • Transactions (Payments, Commissions)                       │  │
│  │  • Settlements (Restaurant & Driver payouts)                  │  │
│  │  • Reviews (Ratings & Comments)                               │  │
│  │  • PromoC                                                          │  │
│  │  • Notifications (SMS, Push, Email logs)                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Order Placement Flow

```
Customer              Platform            Restaurant        Driver           Payment
   │                     │                     │               │               │
   ├─1. Browse Menu──────>                     │               │               │
   │                     │                     │               │               │
   ├─2. Add to Cart──────>                     │               │               │
   │                     │                     │               │               │
   ├─3. Place Order──────>                     │               │               │
   │                     │                     │               │               │
   │                     ├─4. Calculate────────>               │               │
   │                     │   Commission        │               │               │
   │                     │                     │               │               │
   │<─5. Payment Page────┤                     │               │               │
   │                     │                     │               │               │
   ├─6. Pay (GCash)──────┼─────────────────────┼───────────────┼──────────────>│
   │                     │                     │               │               │
   │                     │<─7. Payment Confirm─┼───────────────┼───────────────┤
   │                     │                     │               │               │
   │                     ├─8. Notify Restaurant>               │               │
   │                     │     (SMS + App)     │               │               │
   │                     │                     │               │               │
   │                     │                     ├─9. Accept─────>               │
   │                     │                     │   Order        │               │
   │                     │                     │               │               │
   │                     ├─10. Find Nearest────────────────────>               │
   │                     │     Driver          │               │               │
   │                     │                     │               │               │
   │                     ├─11. Assign Driver───┼───────────────>               │
   │                     │     (SMS + App)     │               │               │
   │                     │                     │               │               │
   │<─12. Driver Info────┤                     │               │               │
   │      (Track Link)   │                     │               │               │
   │                     │                     │               │               │
```

### 2. Delivery Tracking Flow

```
Driver                Platform           Customer          Google Maps
  │                      │                  │                   │
  ├─1. Accept Order──────>                  │                   │
  │                      │                  │                   │
  │                      ├─2. Create────────────────────────────>│
  │                      │   Route         │                   │
  │                      │                  │                   │
  │                      │<─3. Optimized────┼───────────────────┤
  │                      │    Route & ETA   │                   │
  │                      │                  │                   │
  ├─4. Location Update───>                  │                   │
  │   (every 10sec)      │                  │                   │
  │                      │                  │                   │
  │                      ├─5. Broadcast─────>                   │
  │                      │   via Socket.IO  │                   │
  │                      │                  │                   │
  │                      │                  ├─6. Update Map─────>│
  │                      │                  │                   │
  │                      │                  │<─7. Live Route────┤
  │                      │                  │                   │
  ├─8. Mark Delivered────>                  │                   │
  │                      │                  │                   │
  │                      ├─9. Process───────>                   │
  │                      │   Settlement     │                   │
  │                      │                  │                   │
  │                      ├─10. Send Rating──>                   │
  │                      │     Request (SMS)│                   │
  │                      │                  │                   │
```

### 3. Payment & Settlement Flow

```
Customer          Platform         GCash/Maya       Restaurant      Driver
   │                 │                  │               │             │
   ├─1. Pay ₱500─────>                  │               │             │
   │                 │                  │               │             │
   │                 ├─2. Process───────>               │             │
   │                 │   Payment        │               │             │
   │                 │                  │               │             │
   │                 │<─3. Confirmed────┤               │             │
   │                 │                  │               │             │
   │                 ├─4. Calculate Commission:         │             │
   │                 │    • Subtotal: ₱450             │             │
   │                 │    • Delivery: ₱50              │             │
   │                 │    • Platform: ₱81 (18%)        │             │
   │                 │    • Restaurant: ₱369           │             │
   │                 │    • Driver: ₱50                │             │
   │                 │                  │               │             │
   │                 ├─5. Schedule──────────────────────>             │
   │                 │   Settlement     │               │             │
   │                 │   (Daily @ 9AM)  │               │             │
   │                 │                  │               │             │
   │                 ├─6. Schedule──────┼───────────────┼────────────>│
   │                 │   Payout         │               │             │
   │                 │                  │               │             │
   │                 │ (Next day 9 AM)  │               │             │
   │                 ├─7. Payout────────>──────────────>│             │
   │                 │   ₱369          │               │             │
   │                 │                  │               │             │
   │                 ├─8. Payout────────>──────────────────────────────>│
   │                 │   ₱50           │               │             │
   │                 │                  │               │             │
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Language**: JavaScript (ES6+ modules)
- **ORM**: Prisma
- **Database**: MySQL 8.0+
- **Real-time**: Socket.IO
- **Authentication**: express-session + bcrypt

### APIs & Services
- **Payment**: GCash API, Maya API, PayPal API
- **SMS**: Semaphore (Philippines), Twilio (backup)
- **Email**: SendGrid
- **Push**: Firebase Cloud Messaging
- **Maps**: Google Maps Platform (JavaScript, Directions, Distance Matrix)

### Frontend
- **Template Engine**: EJS
- **Styling**: Custom CSS (Light Blue & Orange theme)
- **Client JS**: Vanilla JavaScript + Socket.IO client

### Security
- **Encryption**: bcrypt (12 rounds)
- **Headers**: Helmet.js
- **Rate Limiting**: express-rate-limit
- **CSRF**: csurf
- **Validation**: express-validator

---

## Key Features Implementation

### 1. Automated Driver Assignment
**Algorithm**:
1. Find available drivers in same city
2. Calculate distance to restaurant (Google Maps Distance Matrix API)
3. Score drivers based on:
   - Proximity (50% weight)
   - Rating (30% weight)
   - Experience (20% weight)
4. Assign highest-scoring driver
5. Send notifications via SMS

### 2. Real-Time Tracking
**Implementation**:
- Driver location updates every 10 seconds via REST API
- Socket.IO broadcasts location to customer
- Google Maps Directions API provides route
- ETA recalculated dynamically with traffic data

### 3. Commission & Settlement System
**Flow**:
- **Order Total**: Subtotal + Delivery Fee - Discount
- **Platform Commission**: 18% of subtotal
- **Restaurant Payout**: Subtotal - Commission
- **Driver Payout**: Full delivery fee
- **Settlement**: Automated daily/weekly/monthly via GCash/Maya

### 4. Multi-Channel Notifications
**Triggers**:
- Order Placed → Restaurant (SMS + Push)
- Order Confirmed → Customer (SMS + Email)
- Driver Assigned → Customer + Driver (SMS + Push)
- Out for Delivery → Customer (SMS + Push)
- Delivered → All parties (SMS + Rating request)

---

## Database Schema Summary

### Core Tables
- **User**: Customer, Restaurant Owner, Driver, Admin
- **Restaurant**: Details, location, hours, ratings
- **MenuItem**: Menu with prices, Filipino translations
- **Order**: Status tracking, payment info
- **OrderItem**: Line items with customizations
- **Driver**: Vehicle info, availability, earnings
- **Tracking**: Real-time GPS coordinates
- **Transaction**: Payment records
- **Settlement**: Payout schedules for restaurants/drivers
- **Review**: Ratings for restaurants and drivers
- **PromoCode**: Discount codes
- **Notification**: SMS/Push/Email logs

### Key Relationships
- User 1:1 Restaurant (for owners)
- User 1:1 Driver (for drivers)
- Restaurant 1:N MenuItem
- Order N:1 Restaurant
- Order N:1 Driver
- Order 1:N OrderItem
- Order 1:1 Tracking
- Order 1:1 Transaction
- Order N:N Settlement

---

## Security Measures

1. **Password Hashing**: bcrypt with 12 salt rounds
2. **Session Management**: Secure HTTP-only cookies
3. **CSRF Protection**: csurf middleware on forms
4. **Rate Limiting**: 100 requests per 15 minutes for auth endpoints
5. **Input Validation**: express-validator on all inputs
6. **SQL Injection Prevention**: Prisma ORM parameterized queries
7. **XSS Protection**: Helmet.js CSP headers
8. **HTTPS Only**: Force SSL in production
9. **API Key Security**: Environment variables, never exposed

---

## Scalability Considerations

### Horizontal Scaling
- Stateless Express.js servers (can run multiple instances)
- Session store in Redis (future enhancement)
- Load balancer (Nginx/HAProxy)

### Database Optimization
- Indexed columns: `orderNumber`, `userId`, `status`, `driverId`
- Separate read replicas for analytics
- Connection pooling via Prisma

### Caching Strategy
- Static assets: CDN (Cloudflare)
- API responses: Redis cache for restaurant listings
- Google Maps API: Cache geocoding results

### Performance Targets
- Order placement: < 2 seconds
- Driver assignment: < 5 seconds
- Map loading: < 3 seconds
- Real-time updates: < 1 second
- Support: 1000+ concurrent users

---

## Philippines-Specific Optimizations

1. **Payment Methods**: GCash & Maya prioritized over cards
2. **SMS Provider**: Semaphore (₱0.50/SMS, local rates)
3. **Currency**: All amounts in Philippine Peso (₱)
4. **Phone Format**: +63 validation and formatting
5. **Cities**: Metro Manila, Cebu, Davao coverage
6. **Traffic**: Manila speed estimates (20-25 km/h)
7. **Language**: English + Filipino translations
8. **Business Hours**: 8 AM - 10 PM Philippine Time (GMT+8)
9. **Holidays**: Philippine holiday calendar support

---

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│         Cloud Provider (AWS/GCP)             │
├─────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐│
│  │       Load Balancer (Nginx)             ││
│  └───────────┬────────────────────────────┘│
│              │                               │
│    ┌─────────┼─────────┐                   │
│    │         │         │                    │
│  ┌─▼──┐   ┌─▼──┐   ┌─▼──┐                 │
│  │App │   │App │   │App │  Node.js        │
│  │ 1  │   │ 2  │   │ 3  │  Instances      │
│  └────┘   └────┘   └────┘                  │
│                                              │
│  ┌────────────────────────────────────────┐│
│  │       MySQL Database                    ││
│  │       (Primary + Read Replica)          ││
│  └────────────────────────────────────────┘│
│                                              │
│  ┌────────────────────────────────────────┐│
│  │       Redis Cache (Sessions)            ││
│  └────────────────────────────────────────┘│
│                                              │
└─────────────────────────────────────────────┘
```

---

## Cost Estimate (1,000 orders/month)

| Service | Cost (PHP) |
|---------|------------|
| Hosting (AWS/GCP) | ₱2,000 |
| MySQL Database | ₱1,500 |
| GCash/Maya Fees (3% × ₱1M) | ₱30,000 |
| Semaphore SMS (3/order × ₱0.50) | ₱1,500 |
| Google Maps API | ₱0 (Free tier) |
| Firebase FCM | ₱0 (Free) |
| SendGrid Email | ₱0 (Free tier) |
| **Total Infrastructure** | **₱35,000** |
| **Revenue (18% × ₱1M)** | **₱180,000** |
| **Net Profit** | **₱145,000** |

---

## Monitoring & Analytics

### Metrics to Track
1. **Business Metrics**:
   - Order completion rate
   - Average delivery time
   - Customer satisfaction (ratings)
   - Platform revenue & commission
   - Driver utilization rate

2. **Technical Metrics**:
   - API response times
   - Database query performance
   - Error rates
   - Server uptime
   - WebSocket connection stability

3. **Tools**:
   - Application: Custom analytics dashboard
   - Server: PM2 monitoring
   - Database: MySQL slow query log
   - Errors: Winston logging
   - Uptime: UptimeRobot

---

This architecture is designed to be production-ready, scalable, and optimized specifically for the Philippine market.

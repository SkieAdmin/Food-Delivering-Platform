# PH Food Delivery Platform - API Documentation

Complete API reference for all endpoints, services, and integrations.

---

## Base URL
```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication
Most endpoints require authentication via session cookies. Include credentials in requests:

```javascript
fetch('/api/endpoint', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
```

---

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Restaurant APIs](#restaurant-apis)
3. [Order APIs](#order-apis)
4. [Tracking APIs](#tracking-apis)
5. [Payment APIs](#payment-apis)
6. [Driver APIs](#driver-apis)
7. [Admin APIs](#admin-apis)
8. [External API Integrations](#external-api-integrations)

---

## Authentication APIs

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "email": "juan@example.com",
  "phone": "+639171234567",
  "password": "securePassword123",
  "role": "CUSTOMER"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to +639171234567",
  "userId": 123
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "userId": 123,
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account verified",
  "user": {
    "id": 123,
    "firstName": "Juan",
    "role": "CUSTOMER"
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "juan@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 123,
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "role": "CUSTOMER"
  }
}
```

### Logout
```http
POST /api/auth/logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Restaurant APIs

### List Restaurants
```http
GET /api/restaurants?city=Metro Manila&cuisine=Filipino&isOpen=true
```

**Query Parameters:**
- `city` (optional): Filter by city
- `cuisine` (optional): Filter by cuisine type
- `isOpen` (optional): Filter by open status
- `lat` (optional): User latitude for distance sorting
- `lng` (optional): User longitude

**Response (200):**
```json
{
  "success": true,
  "restaurants": [
    {
      "id": 1,
      "name": "Jollibee Taft",
      "address": "123 Taft Ave, Manila",
      "city": "Metro Manila",
      "cuisine": "Fast Food",
      "rating": 4.5,
      "isOpen": true,
      "deliveryFee": 50,
      "minimumOrder": 100,
      "preparationTime": 25,
      "distance": 2.3,
      "coverImage": "/images/restaurants/jollibee.jpg"
    }
  ]
}
```

### Get Restaurant Details
```http
GET /api/restaurants/:id
```

**Response (200):**
```json
{
  "success": true,
  "restaurant": {
    "id": 1,
    "name": "Jollibee Taft",
    "address": "123 Taft Ave, Manila",
    "city": "Metro Manila",
    "latitude": 14.5547,
    "longitude": 120.9929,
    "cuisine": "Fast Food",
    "rating": 4.5,
    "isOpen": true,
    "openingTime": "08:00",
    "closingTime": "22:00",
    "deliveryFee": 50,
    "minimumOrder": 100,
    "preparationTime": 25,
    "menuItems": [
      {
        "id": 101,
        "name": "Chickenjoy",
        "nameFilipino": "Manok",
        "description": "Crispy fried chicken",
        "price": 89,
        "category": "Main",
        "available": true,
        "isSpicy": false,
        "customizations": [
          {
            "id": 1,
            "name": "Extra Rice",
            "price": 20
          }
        ]
      }
    ]
  }
}
```

### Get Delivery Estimate
```http
POST /api/restaurants/:id/estimate
```

**Request Body:**
```json
{
  "deliveryLat": 14.5995,
  "deliveryLng": 120.9842
}
```

**Response (200):**
```json
{
  "success": true,
  "distance": 3.5,
  "estimatedPrepTime": 25,
  "estimatedDeliveryTime": 18,
  "totalEstimatedTime": 43,
  "deliveryFee": 85
}
```

---

## Order APIs

### Create Order
```http
POST /api/orders
```

**Request Body:**
```json
{
  "restaurantId": 1,
  "items": [
    {
      "menuItemId": 101,
      "quantity": 2,
      "customizations": [1],
      "specialRequest": "No mayo"
    }
  ],
  "deliveryAddress": "456 P. Burgos St, Makati",
  "deliveryCity": "Metro Manila",
  "deliveryLat": 14.5547,
  "deliveryLng": 121.0244,
  "contactNumber": "+639171234567",
  "specialInstructions": "Ring doorbell twice",
  "paymentMethod": "GCASH",
  "promoCode": "WELCOME50"
}
```

**Response (200):**
```json
{
  "success": true,
  "order": {
    "id": 5001,
    "orderNumber": "ORD-20231015-5001",
    "status": "PENDING",
    "subtotal": 218,
    "deliveryFee": 85,
    "platformFee": 39.24,
    "discount": 50,
    "totalAmount": 253,
    "estimatedPrepTime": 25,
    "estimatedDeliveryTime": 18,
    "paymentUrl": "https://checkout.gcash.com/pay/..."
  }
}
```

### Get Order Details
```http
GET /api/orders/:id
```

**Response (200):**
```json
{
  "success": true,
  "order": {
    "id": 5001,
    "orderNumber": "ORD-20231015-5001",
    "status": "OUT_FOR_DELIVERY",
    "subtotal": 218,
    "deliveryFee": 85,
    "totalAmount": 253,
    "deliveryAddress": "456 P. Burgos St, Makati",
    "contactNumber": "+639171234567",
    "paymentMethod": "GCASH",
    "paymentStatus": "COMPLETED",
    "restaurant": {
      "name": "Jollibee Taft",
      "phone": "+639171111111"
    },
    "driver": {
      "name": "Pedro Santos",
      "phone": "+639172222222",
      "vehicleType": "Motorcycle",
      "vehicleNumber": "ABC 1234",
      "currentLat": 14.5620,
      "currentLng": 121.0180
    },
    "items": [
      {
        "name": "Chickenjoy",
        "quantity": 2,
        "price": 89,
        "customizations": "Extra Rice",
        "subtotal": 218
      }
    ],
    "createdAt": "2023-10-15T14:30:00Z",
    "updatedAt": "2023-10-15T14:45:00Z"
  }
}
```

### Update Order Status (Restaurant/Driver)
```http
PATCH /api/orders/:id/status
```

**Request Body:**
```json
{
  "status": "PREPARING"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Order status updated",
  "order": {
    "id": 5001,
    "status": "PREPARING"
  }
}
```

### Cancel Order
```http
POST /api/orders/:id/cancel
```

**Request Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Order cancelled",
  "refundAmount": 253,
  "refundStatus": "PROCESSING"
}
```

---

## Tracking APIs

### Get Live Tracking
```http
GET /api/tracking/:orderId
```

**Response (200):**
```json
{
  "success": true,
  "tracking": {
    "orderId": 5001,
    "driverLat": 14.5620,
    "driverLng": 121.0180,
    "restaurantLat": 14.5547,
    "restaurantLng": 120.9929,
    "customerLat": 14.5547,
    "customerLng": 121.0244,
    "estimatedTime": 12,
    "distanceKm": 2.3,
    "currentStatus": "heading_to_customer",
    "route": "encoded_polyline_string",
    "lastUpdated": "2023-10-15T14:47:30Z"
  }
}
```

### Update Driver Location
```http
POST /api/tracking/driver-location
```

**Request Body:**
```json
{
  "driverId": 45,
  "lat": 14.5625,
  "lng": 121.0185
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Location updated"
}
```

---

## Payment APIs

### Process GCash Payment
```http
POST /api/payments/gcash
```

**Request Body:**
```json
{
  "orderId": 5001,
  "amount": 253,
  "customerEmail": "juan@example.com",
  "customerName": "Juan Dela Cruz",
  "customerPhone": "+639171234567"
}
```

**Response (200):**
```json
{
  "success": true,
  "paymentId": "GCASH_123456789",
  "redirectUrl": "https://api.gcash.com/checkout/...",
  "expiresAt": "2023-10-15T15:00:00Z"
}
```

### Process Maya Payment
```http
POST /api/payments/maya
```

**Request Body:**
```json
{
  "orderId": 5001,
  "amount": 253,
  "customerEmail": "juan@example.com",
  "customerName": "Juan Dela Cruz"
}
```

**Response (200):**
```json
{
  "success": true,
  "checkoutId": "MAYA_ABC123",
  "redirectUrl": "https://pg.paymaya.com/checkout/...",
  "expiresAt": "2023-10-15T15:00:00Z"
}
```

### Verify Payment
```http
POST /api/payments/verify
```

**Request Body:**
```json
{
  "paymentId": "GCASH_123456789",
  "orderId": 5001
}
```

**Response (200):**
```json
{
  "success": true,
  "paymentStatus": "COMPLETED",
  "amount": 253,
  "paidAt": "2023-10-15T14:35:00Z"
}
```

---

## Driver APIs

### Get Available Delivery Requests
```http
GET /api/driver/delivery-requests
```

**Response (200):**
```json
{
  "success": true,
  "requests": [
    {
      "orderId": 5001,
      "orderNumber": "ORD-20231015-5001",
      "restaurant": {
        "name": "Jollibee Taft",
        "address": "123 Taft Ave, Manila",
        "lat": 14.5547,
        "lng": 120.9929
      },
      "deliveryAddress": "456 P. Burgos St, Makati",
      "deliveryLat": 14.5547,
      "deliveryLng": 121.0244,
      "distance": 3.5,
      "deliveryFee": 85,
      "estimatedTime": 18
    }
  ]
}
```

### Accept Delivery
```http
POST /api/driver/accept-delivery
```

**Request Body:**
```json
{
  "orderId": 5001
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Delivery accepted",
  "route": {
    "distance": 3.5,
    "duration": 18,
    "polyline": "encoded_string",
    "steps": [...]
  }
}
```

### Get Driver Earnings
```http
GET /api/driver/earnings?period=2023-10
```

**Response (200):**
```json
{
  "success": true,
  "summary": {
    "total": 45,
    "totalEarnings": 2250,
    "pendingEarnings": 450,
    "paidEarnings": 1800,
    "earnings": [
      {
        "id": 1,
        "orderId": 5001,
        "amount": 85,
        "type": "delivery_fee",
        "status": "paid",
        "paidAt": "2023-10-16T09:00:00Z",
        "createdAt": "2023-10-15T14:30:00Z"
      }
    ]
  }
}
```

---

## Admin APIs

### Get Platform Analytics
```http
GET /api/admin/analytics?period=month
```

**Response (200):**
```json
{
  "success": true,
  "analytics": {
    "totalOrders": 1250,
    "totalRevenue": 625000,
    "totalPlatformFees": 112500,
    "totalRestaurantPayouts": 462500,
    "totalDriverPayouts": 50000,
    "averageOrderValue": 500,
    "period": "month",
    "startDate": "2023-09-15T00:00:00Z",
    "endDate": "2023-10-15T00:00:00Z"
  }
}
```

### Process Settlements
```http
POST /api/admin/settlements/process
```

**Response (200):**
```json
{
  "success": true,
  "results": {
    "processed": 150,
    "failed": 2,
    "total": 152,
    "errors": [
      {
        "settlementId": 789,
        "error": "Insufficient balance"
      }
    ]
  }
}
```

---

## External API Integrations

### Google Maps Service

#### Get Directions
```javascript
import googleMapsService from './services/maps.service.js';

const route = await googleMapsService.getDirections(
  { lat: 14.5547, lng: 120.9929 },
  { lat: 14.5995, lng: 120.9842 }
);
```

**Response:**
```json
{
  "success": true,
  "distance": {
    "value": 3500,
    "text": "3.5 km",
    "km": "3.50"
  },
  "duration": {
    "value": 1080,
    "text": "18 mins",
    "minutes": 18
  },
  "polyline": "encoded_polyline",
  "steps": [...]
}
```

#### Calculate Delivery Fee
```javascript
const fee = googleMapsService.calculateDeliveryFee(3.5);
// Returns: 85 (₱50 base + ₱35 for extra 3.5km)
```

### GCash Service

#### Create Payment
```javascript
import gcashService from './services/gcash.service.js';

const payment = await gcashService.createPayment({
  orderNumber: 'ORD-20231015-5001',
  orderId: 5001,
  totalAmount: 253,
  customerEmail: 'juan@example.com',
  customerFirstName: 'Juan',
  customerLastName: 'Dela Cruz',
  customerPhone: '+639171234567',
  restaurantId: 1,
  deliveryFee: 85,
  platformFee: 39.24
});
```

#### Process Payout
```javascript
const payout = await gcashService.processPayout({
  referenceId: 'PAYOUT_123',
  recipientType: 'gcash_account',
  accountNumber: '+639171234567',
  accountName: 'Juan Dela Cruz',
  amount: 450,
  description: 'Driver earnings',
  settlementId: 789
});
```

### Semaphore SMS Service

#### Send Order Confirmation
```javascript
import semaphoreService from './services/semaphore.service.js';

await semaphoreService.sendOrderConfirmation({
  customerPhone: '+639171234567',
  orderNumber: 'ORD-20231015-5001',
  restaurantName: 'Jollibee Taft',
  estimatedTime: 43,
  orderId: 5001
});
```

#### Send OTP
```javascript
await semaphoreService.sendOTP('+639171234567', '123456');
```

### Driver Assignment Service

#### Assign Driver to Order
```javascript
import driverAssignmentService from './services/driver-assignment.service.js';

const assignment = await driverAssignmentService.assignDriverToOrder(5001);
```

**Response:**
```json
{
  "success": true,
  "driver": {
    "id": 45,
    "name": "Pedro Santos",
    "phone": "+639172222222",
    "vehicleType": "Motorcycle",
    "vehicleNumber": "ABC 1234",
    "rating": 4.8
  },
  "estimatedArrival": 8,
  "deliveryFee": 85
}
```

### Settlement Service

#### Calculate Commission
```javascript
import settlementService from './services/settlement.service.js';

const breakdown = settlementService.calculateCommission({
  subtotal: 450,
  deliveryFee: 50,
  discount: 0
});
```

**Response:**
```json
{
  "subtotal": 450,
  "deliveryFee": 50,
  "discount": 0,
  "platformFee": 81,
  "restaurantAmount": 369,
  "driverAmount": 50,
  "totalAmount": 500
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `AUTH_REQUIRED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid input data
- `PAYMENT_FAILED` (402): Payment processing failed
- `SERVER_ERROR` (500): Internal server error

---

## WebSocket Events (Socket.IO)

### Connect
```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
});
```

### Order Updates
```javascript
// Join order room
socket.emit('join-order', { orderId: 5001 });

// Listen for order updates
socket.on('order-update', (data) => {
  console.log('Order status:', data.status);
});
```

### Driver Location Updates
```javascript
// Join tracking room
socket.emit('join-tracking', { orderId: 5001 });

// Listen for location updates
socket.on('driver-location', (data) => {
  console.log('Driver at:', data.lat, data.lng);
  // Update map marker
});
```

---

## Rate Limits

- **Authentication endpoints**: 5 requests per minute
- **Order creation**: 10 requests per minute
- **General API**: 100 requests per minute
- **Real-time tracking**: No limit

---

## Testing

### Example cURL Requests

#### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "email": "juan@example.com",
    "phone": "+639171234567",
    "password": "securePassword123",
    "role": "CUSTOMER"
  }'
```

#### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "restaurantId": 1,
    "items": [{"menuItemId": 101, "quantity": 2}],
    "deliveryAddress": "456 P. Burgos St, Makati",
    "deliveryLat": 14.5547,
    "deliveryLng": 121.0244,
    "contactNumber": "+639171234567",
    "paymentMethod": "GCASH"
  }'
```

---

For more information, see:
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
- [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- [README.md](./README.md)

# MockAPI.io Integration Guide

## Overview

This Food Delivery Platform now integrates with **MockAPI.io** to simulate an external order processing system. This integration demonstrates how to connect your Express.js backend with external REST APIs.

## What is MockAPI.io?

MockAPI.io is a simple tool that lets you easily mock REST APIs for prototyping and demos. Perfect for:
- Classroom demonstrations
- Frontend development
- API testing
- Prototyping

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Client/Browser │ ───> │  Express Server  │ ───> │   MockAPI.io    │
│                 │ <─── │  (Your Backend)  │ <─── │  (External API) │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

Your Express server acts as a **proxy/connector** between your frontend and the MockAPI service.

## API Endpoints

### Base URL
```
https://68e85f93f2707e6128caa838.mockapi.io/order/processor
```

### Available Routes

#### 1. Test Connection
```http
GET /api/order-processor/test
```

**Response:**
```json
{
  "success": true,
  "message": "MockAPI connection successful",
  "baseURL": "https://68e85f93f2707e6128caa838.mockapi.io/order/processor",
  "recordsFound": 5
}
```

---

#### 2. Get All Orders
```http
GET /api/order-processor
```

**Response:**
```json
{
  "success": true,
  "message": "Orders fetched successfully",
  "count": 5,
  "data": [
    {
      "id": "1",
      "orderNumber": "ORD-1234567890",
      "customerId": 1,
      "customerName": "Juan Dela Cruz",
      "restaurantId": 1,
      "restaurantName": "Jollibee",
      "items": [...],
      "totalAmount": 350.50,
      "deliveryAddress": "123 Main St, Manila",
      "deliveryFee": 50,
      "status": "CONFIRMED",
      "paymentMethod": "CASH",
      "paymentStatus": "PENDING",
      "notes": "",
      "createdAt": "2025-10-10T12:00:00.000Z",
      "updatedAt": "2025-10-10T12:30:00.000Z"
    }
  ]
}
```

---

#### 3. Get Order by ID
```http
GET /api/order-processor/:id
```

**Example:**
```bash
GET /api/order-processor/1
```

**Response:**
```json
{
  "success": true,
  "message": "Order fetched successfully",
  "data": {
    "id": "1",
    "orderNumber": "ORD-1234567890",
    "customerName": "Juan Dela Cruz",
    "status": "CONFIRMED",
    ...
  }
}
```

---

#### 4. Create New Order
```http
POST /api/order-processor
Content-Type: application/json
```

**Required Fields:**
- `customerName` (string)
- `restaurantName` (string)
- `totalAmount` (number)
- `deliveryAddress` (string)

**Optional Fields:**
- `orderNumber` (string) - auto-generated if not provided
- `customerId` (number)
- `restaurantId` (number)
- `items` (array)
- `deliveryFee` (number)
- `status` (string) - defaults to 'PENDING'
- `paymentMethod` (string)
- `paymentStatus` (string)
- `notes` (string)

**Request Body:**
```json
{
  "customerName": "Juan Dela Cruz",
  "restaurantName": "Jollibee",
  "totalAmount": 450.00,
  "deliveryAddress": "123 Main St, Quezon City, Metro Manila",
  "deliveryFee": 50,
  "items": [
    {
      "name": "Chickenjoy",
      "quantity": 2,
      "price": 100
    },
    {
      "name": "Jolly Spaghetti",
      "quantity": 1,
      "price": 75
    }
  ],
  "paymentMethod": "CASH",
  "notes": "Extra gravy please"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "6",
    "orderNumber": "ORD-1728567890123",
    "customerName": "Juan Dela Cruz",
    "restaurantName": "Jollibee",
    "totalAmount": 450,
    "status": "PENDING",
    ...
  }
}
```

---

#### 5. Update Order (Full Replacement)
```http
PUT /api/order-processor/:id
Content-Type: application/json
```

**Example:**
```bash
PUT /api/order-processor/1
```

**Request Body:**
```json
{
  "customerName": "Juan Dela Cruz Jr.",
  "restaurantName": "Jollibee",
  "totalAmount": 500.00,
  "deliveryAddress": "456 New St, Manila",
  "status": "CONFIRMED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order updated successfully",
  "data": { ... }
}
```

---

#### 6. Patch Order (Partial Update)
```http
PATCH /api/order-processor/:id
Content-Type: application/json
```

**Example:**
```bash
PATCH /api/order-processor/1
```

**Request Body:**
```json
{
  "status": "OUT_FOR_DELIVERY",
  "notes": "Driver on the way"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order patched successfully",
  "data": { ... }
}
```

---

#### 7. Update Order Status (Convenience Endpoint)
```http
PATCH /api/order-processor/:id/status
Content-Type: application/json
```

**Valid Statuses:**
- `PENDING`
- `CONFIRMED`
- `PREPARING`
- `READY`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `CANCELLED`

**Example:**
```bash
PATCH /api/order-processor/1/status
```

**Request Body:**
```json
{
  "status": "DELIVERED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated to DELIVERED",
  "data": { ... }
}
```

---

#### 8. Delete Order
```http
DELETE /api/order-processor/:id
```

**Example:**
```bash
DELETE /api/order-processor/1
```

**Response:**
```json
{
  "success": true,
  "message": "Order deleted successfully",
  "data": { ... }
}
```

---

## File Structure

```
src/
├── services/
│   └── mockapi.service.js        # MockAPI connector service
├── controllers/
│   └── order-processor.controller.js  # Request handlers
└── routes/
    └── order-processor.routes.js      # API route definitions
```

### Service Layer (`mockapi.service.js`)
Handles all communication with MockAPI.io:
- Axios HTTP requests
- Error handling
- Data validation
- Response formatting

### Controller Layer (`order-processor.controller.js`)
Processes requests and responses:
- Request validation
- Calls service methods
- Formats responses
- HTTP status codes

### Routes Layer (`order-processor.routes.js`)
Defines API endpoints:
- Route definitions
- HTTP methods
- Documentation

---

## Testing the API

### Using cURL

**1. Test Connection:**
```bash
curl http://localhost:3000/api/order-processor/test
```

**2. Get All Orders:**
```bash
curl http://localhost:3000/api/order-processor
```

**3. Create Order:**
```bash
curl -X POST http://localhost:3000/api/order-processor \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Maria Santos",
    "restaurantName": "McDo",
    "totalAmount": 300,
    "deliveryAddress": "789 Street, Manila"
  }'
```

**4. Update Status:**
```bash
curl -X PATCH http://localhost:3000/api/order-processor/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'
```

**5. Delete Order:**
```bash
curl -X DELETE http://localhost:3000/api/order-processor/1
```

### Using Postman

1. Import the collection (create a new collection)
2. Set base URL: `http://localhost:3000`
3. Add requests for each endpoint
4. Test all CRUD operations

### Using Browser (GET only)

```
http://localhost:3000/api/order-processor/test
http://localhost:3000/api/order-processor
http://localhost:3000/api/order-processor/1
```

---

## Frontend Integration Examples

### Fetch API

```javascript
// Get all orders
async function getAllOrders() {
  try {
    const response = await fetch('/api/order-processor');
    const data = await response.json();

    if (data.success) {
      console.log('Orders:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Create order
async function createOrder(orderData) {
  try {
    const response = await fetch('/api/order-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('Order created:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Update status
async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`/api/order-processor/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (data.success) {
      console.log('Status updated:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Axios

```javascript
import axios from 'axios';

// Get all orders
const orders = await axios.get('/api/order-processor');
console.log(orders.data);

// Create order
const newOrder = await axios.post('/api/order-processor', {
  customerName: 'Pedro Garcia',
  restaurantName: 'Jollibee',
  totalAmount: 400,
  deliveryAddress: '123 Street, Manila'
});
console.log(newOrder.data);

// Update status
const updated = await axios.patch('/api/order-processor/1/status', {
  status: 'CONFIRMED'
});
console.log(updated.data);
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Server Error
- `503` - Service Unavailable (MockAPI connection failed)

---

## Environment Variables

Add to your `.env` file:

```bash
MOCKAPI_BASE_URL="https://68e85f93f2707e6128caa838.mockapi.io/order/processor"
```

**Note:** The URL is optional. If not set, it defaults to the URL above.

---

## Logging

The integration includes comprehensive logging:

```
[MockAPI] Fetching all orders...
[MockAPI] Successfully fetched 5 orders
[Controller] GET /api/order-processor - Fetching all orders
```

**Log Prefixes:**
- `[MockAPI]` - Service layer operations
- `[Controller]` - Controller operations

---

## Classroom Demo Flow

### 1. Start the Server
```bash
npm start
```

### 2. Test Connection
```bash
curl http://localhost:3000/api/order-processor/test
```

### 3. View Existing Orders
```bash
curl http://localhost:3000/api/order-processor
```

### 4. Create a New Order
```bash
curl -X POST http://localhost:3000/api/order-processor \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Demo Student",
    "restaurantName": "Demo Restaurant",
    "totalAmount": 500,
    "deliveryAddress": "University Campus"
  }'
```

### 5. Update Order Status
```bash
curl -X PATCH http://localhost:3000/api/order-processor/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'
```

### 6. Delete Order
```bash
curl -X DELETE http://localhost:3000/api/order-processor/1
```

---

## Advantages of This Architecture

✅ **Separation of Concerns**
- Service handles API communication
- Controller handles request/response
- Routes handle endpoint definitions

✅ **Error Handling**
- Consistent error responses
- Detailed logging
- Graceful degradation

✅ **Modularity**
- Easy to test
- Easy to maintain
- Easy to extend

✅ **Clean Code**
- Well-documented
- Type-safe patterns
- Modern ES6+ syntax

✅ **Educational Value**
- Shows real-world API integration
- Demonstrates REST principles
- Production-ready patterns

---

## Production Considerations

### Replace MockAPI with Real API

When moving to production, simply update the service:

```javascript
// mockapi.service.js
constructor() {
  this.baseURL = process.env.PRODUCTION_API_URL || 'https://api.yourproduction.com/orders';
  // Add authentication
  this.apiKey = process.env.API_KEY;
}
```

### Add Authentication

```javascript
async getAllOrders() {
  const response = await axios.get(this.baseURL, {
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }
  });
}
```

### Add Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/order-processor', apiLimiter, orderProcessorRoutes);
```

---

## Troubleshooting

### Issue: Connection Failed

**Error:**
```json
{
  "success": false,
  "error": "No response from MockAPI server"
}
```

**Solution:**
- Check internet connection
- Verify MockAPI URL is correct
- Check if MockAPI service is online

### Issue: Invalid Status

**Error:**
```json
{
  "success": false,
  "message": "Invalid status",
  "validStatuses": ["PENDING", "CONFIRMED", ...]
}
```

**Solution:**
- Use one of the valid status values
- Check spelling and capitalization

### Issue: Missing Required Fields

**Error:**
```json
{
  "success": false,
  "message": "Missing required fields",
  "missingFields": ["customerName", "totalAmount"]
}
```

**Solution:**
- Include all required fields in request body
- Check field names match exactly

---

## Additional Resources

- **MockAPI.io Docs:** https://mockapi.io/docs
- **Axios Docs:** https://axios-http.com/docs/intro
- **Express Routing:** https://expressjs.com/en/guide/routing.html
- **REST API Best Practices:** https://restfulapi.net/

---

## Summary

This integration demonstrates:
1. ✅ External API integration
2. ✅ Service layer architecture
3. ✅ Error handling
4. ✅ Logging and debugging
5. ✅ RESTful API design
6. ✅ Production-ready patterns

Perfect for classroom demonstrations and real-world learning!

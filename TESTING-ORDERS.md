# Order System Debugging Guide

## Problem
Items show "successfully added to cart" but don't appear in "My Orders" at `/orders`

## Root Causes Identified

1. **Orders only appear after completing checkout** - Adding to cart is NOT the same as placing an order
2. **Session/authentication issues** - User might not be logged in properly
3. **Order creation failures** - Backend errors preventing order from being saved

## Testing Steps

### Step 1: Check if you're logged in

1. Open your browser
2. Navigate to https://food.ccshub.uk
3. **Make sure you are logged in** - Check if your name appears in the header
4. If not logged in, click "Login" or "Register"

### Step 2: Verify the complete order flow

1. **Browse Restaurants**: Go to https://food.ccshub.uk/restaurants
2. **Select a Restaurant**: Click on any restaurant
3. **Add Items to Cart**:
   - Click "Add Order" button on a menu item
   - Select quantity
   - Click "Confirm & Add to Cart"
   - You should see: "✓ Added to your cart! Click 'Proceed to Checkout' below"
   - Notice the **floating cart widget** (orange box, bottom-right)
   - Notice the **"🛒 Proceed to Checkout & Complete Order"** button at the bottom

4. **Proceed to Checkout**:
   - Click the big orange "Proceed to Checkout" button OR
   - Click the floating cart widget
   - You should be redirected to `/orders/checkout`

5. **Complete Checkout**:
   - Enter a delivery address in the text field
   - Wait for the map marker to update (or drag the marker)
   - Make sure latitude/longitude are set (the map should move)
   - Click **"Place Order (Pay on Delivery)"** button
   - Button should change to "Placing Order..."

6. **Order Confirmation**:
   - You should see: "✓ Order placed successfully! Order #XXXXX"
   - You will be redirected to `/orders/{orderId}` (order details page)

7. **View My Orders**:
   - Navigate to https://food.ccshub.uk/orders
   - Your order should now be visible!

### Step 3: Check Browser Console for Errors

**Open Browser Developer Tools** (F12 or Right-click → Inspect)

1. Go to the **Console** tab
2. Try placing an order again
3. Look for these debug messages:

**On Checkout Page:**
```
=== CLIENT-SIDE ORDER DEBUG ===
Order data being sent: {...}
Restaurant ID: X
Cart items: [...]
```

**After clicking "Place Order":**
```
✓ Server response: {success: true, orderId: X, orderNumber: "..."}
✓ Order created! ID: X Number: XXXXX
Redirecting to order details page...
```

**If you see errors instead:**
```
ERROR: No userId in session
Failed to place order: You must be logged in
```
→ You're not logged in! Go back to Step 1

```
ERROR: Cart is empty
```
→ Cart data was lost. Check if localStorage is enabled in your browser.

### Step 4: Check Server Logs

If you have access to the server console, look for:

**When creating order:**
```
=== CREATE ORDER DEBUG ===
Session userId: X
Restaurant ID: Y
Items: [...]
Delivery Address: ...
Total amount: XX.XX
Order items count: X
✓ Order created successfully: X XXXXX
✓ Customer ID: X
```

**When viewing orders:**
```
=== LIST ORDERS DEBUG ===
Session userId: X
✓ Found X orders for userId: X
```

### Step 5: Run the Database Debug Script

From the project directory, run:

```bash
node debug-orders.js
```

This will show:
- Total orders in the database
- Order details (ID, customer, items, etc.)
- All customers in the system
- Order count per customer

**Expected Output:**
```
=== DATABASE ORDER DEBUG ===

Total orders in database: 5

✓ Orders found! Here are the details:

--- Order 1 ---
Order ID: 1
Order Number: ORD-2025-001
Customer ID: 3
Customer Name: John Doe
...
```

**If you see "Total orders: 0":**
→ Orders are NOT being saved to the database. Check server logs for errors.

## Common Issues & Solutions

### Issue 1: "My Orders" page is empty but checkout "succeeded"

**Cause:** Order creation failed silently OR you're logged in as a different user

**Solution:**
1. Check browser console for error messages
2. Check server logs for "Create order error"
3. Run `node debug-orders.js` to see all orders and which users they belong to
4. Make sure you're logged in as the same user who placed the order

### Issue 2: Redirected to login page when clicking "Proceed to Checkout"

**Cause:** You're not logged in or session expired

**Solution:**
1. Log in first at https://food.ccshub.uk/login
2. Make sure cookies are enabled in your browser
3. Try again after logging in

### Issue 3: Cart is empty on checkout page

**Cause:** localStorage was cleared OR you opened checkout in a new tab/window without following the flow

**Solution:**
1. Go back to the restaurant menu page
2. Add items to cart again
3. Click "Proceed to Checkout" button (don't manually type the URL)

### Issue 4: "Failed to create order" error

**Cause:** Backend error (database, validation, etc.)

**Solution:**
1. Check server logs for detailed error message
2. Common issues:
   - Database connection failed
   - Menu items don't exist
   - Invalid restaurant ID
   - SMS service error (non-critical)

## Debugging Checklist

- [ ] User is logged in (name appears in header)
- [ ] User is verified (completed OTP verification)
- [ ] Items are in cart (floating orange cart widget visible)
- [ ] Proceeded to checkout (not just added to cart)
- [ ] Entered delivery address on checkout page
- [ ] Map location was selected (marker visible)
- [ ] Clicked "Place Order" button
- [ ] Saw success message with order number
- [ ] Was redirected to order details page
- [ ] Checked browser console (no errors)
- [ ] Checked server logs (order created successfully)
- [ ] Ran debug script (order exists in database)

## Still Not Working?

If you've followed all steps and orders still don't appear:

1. **Clear browser data:**
   - Clear cookies and cache
   - Log out and log back in

2. **Check database:**
   ```bash
   node debug-orders.js
   ```

3. **Check server logs** - Look for any error messages during order creation

4. **Verify database schema:**
   ```bash
   npm run db:generate
   ```

5. **Test with a fresh user account:**
   - Register a new account
   - Verify with OTP
   - Try placing an order

## Contact Information

If the issue persists, provide:
- Browser console logs (screenshot of errors)
- Server console logs (if accessible)
- Output of `node debug-orders.js`
- User ID you're logged in as
- Steps you followed exactly

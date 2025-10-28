import prisma from './src/config/database.js';

async function debugOrders() {
  console.log('\n=== DATABASE ORDER DEBUG ===\n');

  try {
    // Get all orders
    const allOrders = await prisma.order.findMany({
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        },
        restaurant: {
          select: { id: true, name: true }
        },
        orderItems: {
          include: {
            menuItem: {
              select: { name: true, price: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total orders in database: ${allOrders.length}\n`);

    if (allOrders.length === 0) {
      console.log('❌ No orders found in the database!');
      console.log('This means orders are not being created.\n');
    } else {
      console.log('✓ Orders found! Here are the details:\n');

      allOrders.forEach((order, index) => {
        console.log(`--- Order ${index + 1} ---`);
        console.log(`Order ID: ${order.id}`);
        console.log(`Order Number: ${order.orderNumber}`);
        console.log(`Customer ID: ${order.customerId}`);
        console.log(`Customer Name: ${order.customer.name}`);
        console.log(`Customer Email: ${order.customer.email}`);
        console.log(`Restaurant: ${order.restaurant.name}`);
        console.log(`Status: ${order.status}`);
        console.log(`Total Amount: $${order.totalAmount.toFixed(2)}`);
        console.log(`Items: ${order.orderItems.length}`);
        order.orderItems.forEach(item => {
          console.log(`  - ${item.quantity}x ${item.menuItem.name} @ $${item.price.toFixed(2)}`);
        });
        console.log(`Created: ${order.createdAt}`);
        console.log('');
      });
    }

    // Get all users
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, isVerified: true }
    });

    console.log(`\n--- Customers in database: ${users.length} ---`);
    users.forEach(user => {
      console.log(`User ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Verified: ${user.isVerified}`);
    });

    // Get order count per user
    console.log('\n--- Orders per customer ---');
    for (const user of users) {
      const orderCount = await prisma.order.count({
        where: { customerId: user.id }
      });
      console.log(`${user.name} (ID: ${user.id}): ${orderCount} orders`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugOrders();

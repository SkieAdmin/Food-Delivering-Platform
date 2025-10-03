import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create sample customers
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: hashedPassword,
      phone: '+1234567890',
      role: 'CUSTOMER',
      isVerified: true
    }
  });

  // Create sample restaurant owners
  const restaurantOwner1 = await prisma.user.create({
    data: {
      email: 'pizzapalace@example.com',
      password: hashedPassword,
      phone: '+1234567891',
      role: 'RESTAURANT',
      isVerified: true,
      restaurant: {
        create: {
          name: 'Pizza Palace',
          address: '123 Main St, New York, NY',
          latitude: 40.7128,
          longitude: -74.0060,
          cuisine: 'Italian',
          rating: 4.5,
          isOpen: true
        }
      }
    },
    include: {
      restaurant: true
    }
  });

  const restaurantOwner2 = await prisma.user.create({
    data: {
      email: 'burgerhouse@example.com',
      password: hashedPassword,
      phone: '+1234567892',
      role: 'RESTAURANT',
      isVerified: true,
      restaurant: {
        create: {
          name: 'Burger House',
          address: '456 Oak Ave, New York, NY',
          latitude: 40.7580,
          longitude: -73.9855,
          cuisine: 'American',
          rating: 4.2,
          isOpen: true
        }
      }
    },
    include: {
      restaurant: true
    }
  });

  const restaurantOwner3 = await prisma.user.create({
    data: {
      email: 'sushispot@example.com',
      password: hashedPassword,
      phone: '+1234567893',
      role: 'RESTAURANT',
      isVerified: true,
      restaurant: {
        create: {
          name: 'Sushi Spot',
          address: '789 Park Blvd, New York, NY',
          latitude: 40.7589,
          longitude: -73.9851,
          cuisine: 'Japanese',
          rating: 4.8,
          isOpen: true
        }
      }
    },
    include: {
      restaurant: true
    }
  });

  // Create menu items for Pizza Palace
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
        price: 12.99,
        restaurantId: restaurantOwner1.restaurant.id,
        available: true
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Loaded with pepperoni and extra cheese',
        price: 14.99,
        restaurantId: restaurantOwner1.restaurant.id,
        available: true
      },
      {
        name: 'Vegetarian Pizza',
        description: 'Fresh vegetables including bell peppers, onions, and mushrooms',
        price: 13.99,
        restaurantId: restaurantOwner1.restaurant.id,
        available: true
      },
      {
        name: 'Garlic Bread',
        description: 'Toasted bread with garlic butter and herbs',
        price: 5.99,
        restaurantId: restaurantOwner1.restaurant.id,
        available: true
      }
    ]
  });

  // Create menu items for Burger House
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Classic Cheeseburger',
        description: 'Beef patty with cheese, lettuce, tomato, and special sauce',
        price: 10.99,
        restaurantId: restaurantOwner2.restaurant.id,
        available: true
      },
      {
        name: 'Double Bacon Burger',
        description: 'Two beef patties with bacon, cheese, and BBQ sauce',
        price: 15.99,
        restaurantId: restaurantOwner2.restaurant.id,
        available: true
      },
      {
        name: 'Veggie Burger',
        description: 'Plant-based patty with avocado and chipotle mayo',
        price: 11.99,
        restaurantId: restaurantOwner2.restaurant.id,
        available: true
      },
      {
        name: 'French Fries',
        description: 'Crispy golden fries with sea salt',
        price: 4.99,
        restaurantId: restaurantOwner2.restaurant.id,
        available: true
      },
      {
        name: 'Onion Rings',
        description: 'Beer-battered crispy onion rings',
        price: 5.99,
        restaurantId: restaurantOwner2.restaurant.id,
        available: true
      }
    ]
  });

  // Create menu items for Sushi Spot
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'California Roll',
        description: 'Crab, avocado, and cucumber roll',
        price: 8.99,
        restaurantId: restaurantOwner3.restaurant.id,
        available: true
      },
      {
        name: 'Spicy Tuna Roll',
        description: 'Fresh tuna with spicy mayo',
        price: 10.99,
        restaurantId: restaurantOwner3.restaurant.id,
        available: true
      },
      {
        name: 'Salmon Sashimi',
        description: 'Fresh salmon slices (8 pieces)',
        price: 14.99,
        restaurantId: restaurantOwner3.restaurant.id,
        available: true
      },
      {
        name: 'Dragon Roll',
        description: 'Eel and cucumber topped with avocado',
        price: 13.99,
        restaurantId: restaurantOwner3.restaurant.id,
        available: true
      },
      {
        name: 'Edamame',
        description: 'Steamed soybeans with sea salt',
        price: 4.99,
        restaurantId: restaurantOwner3.restaurant.id,
        available: true
      }
    ]
  });

  // Create sample driver
  const driver1 = await prisma.user.create({
    data: {
      email: 'driver@example.com',
      password: hashedPassword,
      phone: '+1234567894',
      role: 'DRIVER',
      isVerified: true,
      driver: {
        create: {
          vehicleType: 'Motorcycle',
          vehicleNumber: 'DRV-1234',
          isAvailable: true,
          currentLat: 40.7128,
          currentLng: -74.0060
        }
      }
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📧 Sample Login Credentials:');
  console.log('Customer: customer@example.com / password123');
  console.log('Restaurant: pizzapalace@example.com / password123');
  console.log('Driver: driver@example.com / password123');
  console.log('\n🍕 3 Restaurants created with menu items');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

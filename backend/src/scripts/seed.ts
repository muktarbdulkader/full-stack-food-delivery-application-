import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { Admin } from '../models/Admin.model';
import { Food } from '../models/Food.model';
import { hashPassword } from '../utils/hash';
import { env } from '../config/env';

const seedDatabase = async () => {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('Connected to MongoDB');

    // Create Admin User
    const existingAdminUser = await User.findOne({ email: 'admin@foodhub.com' });
    const hashedPassword = await hashPassword('admin123');

    if (!existingAdminUser) {
      await User.create({
        name: 'Admin',
        email: 'admin@foodhub.com',
        password: hashedPassword,
        role: 'admin',
        phone: '0911000000',
      });
      console.log('✅ Admin user created in User collection:');
      console.log('   Email: admin@foodhub.com');
      console.log('   Password: admin123');
    } else {
      console.log('Admin user already exists in User collection');
    }

    // Also create in Admin collection for dedicated Admin Portal auth
    const existingAdmin = await Admin.findOne({ email: 'admin@foodhub.com' });
    if (!existingAdmin) {
      await Admin.create({
        name: 'Admin',
        email: 'admin@foodhub.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('✅ Admin created in Admin collection:');
      console.log('   Email: admin@foodhub.com');
      console.log('   Password: admin123');
    } else {
      console.log('Admin already exists in Admin collection');
    }

    // Create Sample Foods
    const foodCount = await Food.countDocuments();
    if (foodCount === 0) {
      const sampleFoods = [
        {
          name: 'Doro Wat',
          description: 'Traditional Ethiopian spicy chicken stew with berbere spices, served with injera',
          price: 250,
          category: 'Ethiopian',
          image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500',
          isAvailable: true,
        },
        {
          name: 'Tibs',
          description: 'Sautéed beef or lamb with onions, tomatoes, and jalapeños',
          price: 280,
          category: 'Ethiopian',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
          isAvailable: true,
        },
        {
          name: 'Kitfo',
          description: 'Ethiopian steak tartare seasoned with mitmita and niter kibbeh',
          price: 320,
          category: 'Ethiopian',
          image: 'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=500',
          isAvailable: true,
        },
        {
          name: 'Shiro',
          description: 'Chickpea flour stew with berbere, perfect vegetarian option',
          price: 150,
          category: 'Ethiopian',
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500',
          isAvailable: true,
        },
        {
          name: 'Burger Deluxe',
          description: 'Juicy beef patty with cheese, lettuce, tomato, and special sauce',
          price: 180,
          category: 'Burger',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
          isAvailable: true,
        },
        {
          name: 'Margherita Pizza',
          description: 'Classic Italian pizza with fresh mozzarella, tomatoes, and basil',
          price: 220,
          category: 'Pizza',
          image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500',
          isAvailable: true,
        },
        {
          name: 'Chicken Shawarma',
          description: 'Grilled chicken wrapped in pita with garlic sauce and vegetables',
          price: 160,
          category: 'Shawarma',
          image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=500',
          isAvailable: true,
        },
        {
          name: 'Pasta Carbonara',
          description: 'Creamy pasta with bacon, parmesan, and egg',
          price: 200,
          category: 'Pasta',
          image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500',
          isAvailable: true,
        },
        {
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with parmesan, croutons, and caesar dressing',
          price: 120,
          category: 'Salad',
          image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500',
          isAvailable: true,
        },
        {
          name: 'Chocolate Cake',
          description: 'Rich chocolate layers with creamy frosting',
          price: 100,
          category: 'Dessert',
          image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500',
          isAvailable: true,
        },
        {
          name: 'Fresh Juice',
          description: 'Mixed tropical fruit juice - mango, papaya, and orange',
          price: 80,
          category: 'Drinks',
          image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500',
          isAvailable: true,
        },
        {
          name: 'Ethiopian Coffee',
          description: 'Traditional buna ceremony coffee, freshly roasted',
          price: 60,
          category: 'Drinks',
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
          isAvailable: true,
        },
      ];

      await Food.insertMany(sampleFoods);
      console.log(`✅ ${sampleFoods.length} food items created`);
    } else {
      console.log(`${foodCount} food items already exist`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 To access admin panel:');
    console.log('   1. Go to http://localhost:5173/login');
    console.log('   2. Login with: admin@foodhub.com / admin123');
    console.log('   3. Click "Admin" in the navbar');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

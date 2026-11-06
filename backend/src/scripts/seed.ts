import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { Admin } from '../models/Admin.model';
import { Food } from '../models/Food.model';
import { Organization } from '../models/Organization.model';
import { Branch } from '../models/Branch.model';
import { RestaurantTable } from '../models/RestaurantTable.model';
import { generateSecureQRToken, generateTableQRCodeDataUrl } from '../services/qr.service';
import { hashPassword } from '../utils/hash';
import { env } from '../config/env';

const seedDatabase = async () => {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('Connected to MongoDB');

    // 1. Seed Organization
    let organization = await Organization.findOne({ slug: 'foodhub-ethiopia' });
    if (!organization) {
      organization = await Organization.create({
        name: 'FoodHub Restaurant Group',
        slug: 'foodhub-ethiopia',
        businessType: 'chain',
        contactEmail: 'hq@foodhub.et',
        contactPhone: '+251 911 234 567',
        taxIdentificationNumber: 'TIN-0099887766',
        address: {
          street: 'Bole Road, Olympia',
          city: 'Addis Ababa',
          country: 'Ethiopia',
        },
        settings: {
          taxRate: 0.15,
          serviceChargeRate: 0.05,
          currency: 'ETB',
          allowGuestOrdering: true,
          autoAcceptOrders: false,
          kdsEnabled: true,
        },
      });
      console.log('✅ Organization created: FoodHub Restaurant Group');
    }

    // 2. Seed Branches
    let haramayaBranch = await Branch.findOne({ code: 'HRM-01' });
    if (!haramayaBranch) {
      haramayaBranch = await Branch.create({
        organizationId: organization._id,
        name: 'Haramaya Branch',
        code: 'HRM-01',
        phone: '+251 922 112 233',
        email: 'haramaya@foodhub.et',
        address: {
          street: 'Campus Main Avenue',
          city: 'Haramaya',
          country: 'Ethiopia',
        },
        diningAreas: ['Main Dining Hall', 'Outdoor Patio', 'VIP Lounge', 'Student Area'],
        isMainBranch: false,
      });
      console.log('✅ Branch created: Haramaya Branch (HRM-01)');
    }

    let boleBranch = await Branch.findOne({ code: 'BOL-01' });
    if (!boleBranch) {
      boleBranch = await Branch.create({
        organizationId: organization._id,
        name: 'Bole Branch',
        code: 'BOL-01',
        phone: '+251 911 556 677',
        email: 'bole@foodhub.et',
        address: {
          street: 'Cameroon St, Near Edna Mall',
          subcity: 'Bole',
          city: 'Addis Ababa',
          country: 'Ethiopia',
        },
        diningAreas: ['Ground Hall', 'Terrace Balcony', 'Executive VIP Lounge'],
        isMainBranch: true,
      });
      console.log('✅ Branch created: Bole Branch (BOL-01)');
    }

    // 3. Seed Tables for Haramaya Branch
    const tableTemplates = [
      { number: '01', name: 'Table 01 - Main Hall', area: 'Main Dining Hall', cap: 4 },
      { number: '02', name: 'Table 02 - Intimate Booth', area: 'Main Dining Hall', cap: 2 },
      { number: '03', name: 'Table 03 - Window View', area: 'Main Dining Hall', cap: 4 },
      { number: '04', name: 'Table 04 - Garden Patio', area: 'Outdoor Patio', cap: 6 },
      { number: '05', name: 'Table 05 - Presidential Suite', area: 'VIP Lounge', cap: 8 },
    ];

    for (const t of tableTemplates) {
      const existing = await RestaurantTable.findOne({
        branchId: haramayaBranch._id,
        tableNumber: t.number,
      });

      if (!existing) {
        const qrToken = generateSecureQRToken();
        const qrCodeUrl = await generateTableQRCodeDataUrl(qrToken);

        await RestaurantTable.create({
          organizationId: organization._id,
          branchId: haramayaBranch._id,
          tableNumber: t.number,
          name: t.name,
          diningArea: t.area,
          capacity: t.cap,
          status: 'available',
          qrToken,
          qrCodeUrl,
        });
        console.log(`✅ Table #${t.number} created with QR Code in Haramaya Branch`);
      }
    }

    // 4. Create Admin Users
    const existingAdminUser = await User.findOne({ email: 'admin@foodhub.com' });
    const hashedPassword = await hashPassword('admin123');

    if (!existingAdminUser) {
      await User.create({
        name: 'Master Admin',
        email: 'admin@foodhub.com',
        password: hashedPassword,
        role: 'super_admin',
        organizationId: organization._id,
        branchId: boleBranch._id,
        phone: '0911000000',
        permissions: ['all'],
      });
      console.log('✅ Admin user created in User collection: admin@foodhub.com / admin123');
    }

    const existingAdmin = await Admin.findOne({ email: 'admin@foodhub.com' });
    if (!existingAdmin) {
      await Admin.create({
        name: 'Master Admin',
        email: 'admin@foodhub.com',
        password: hashedPassword,
        role: 'admin',
        organizationId: organization._id,
        branchId: boleBranch._id,
      });
      console.log('✅ Admin created in Admin collection: admin@foodhub.com / admin123');
    }

    // 5. Seed Sample Foods with Customizations & Portions
    const foodCount = await Food.countDocuments();
    if (foodCount === 0) {
      const sampleFoods = [
        {
          name: 'Doro Wat Special',
          description: 'Slow-cooked traditional Ethiopian chicken stew with berbere, boiled egg & injera',
          price: 280,
          category: 'Ethiopian',
          image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600',
          portions: [
            { name: 'Standard Portion', price: 280, isDefault: true },
            { name: 'Family Platter (Double)', price: 520, isDefault: false },
          ],
          extras: [
            { name: 'Extra Boiled Egg', price: 25 },
            { name: 'Fresh Ayib (Cottage Cheese)', price: 40 },
            { name: 'Extra Soft Injera', price: 30 },
          ],
          spiceLevel: 'Spicy',
          isFasting: false,
          isAvailable: true,
          kitchenStation: 'Traditional Stew Station',
          preparationTimeMinutes: 20,
        },
        {
          name: 'Sizzling Beef Tibs',
          description: 'Tender cubed beef sautéed with onions, garlic, jalapeños, rosemary & awaze',
          price: 350,
          category: 'Ethiopian',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
          portions: [
            { name: 'Regular Sizzler', price: 350, isDefault: true },
            { name: 'Special Shekla Tibs (Clay Pot)', price: 420, isDefault: false },
          ],
          extras: [
            { name: 'Spicy Awaze Dip', price: 20 },
            { name: 'Extra Mitmita', price: 15 },
            { name: 'Fried Jalapeños', price: 20 },
          ],
          spiceLevel: 'Medium',
          isFasting: false,
          isAvailable: true,
          kitchenStation: 'Grill Station',
          preparationTimeMinutes: 15,
        },
        {
          name: 'Traditional Kitfo Tartare',
          description: 'Finely minced lean beef seasoned with mitmita and herbal niter kibbeh',
          price: 390,
          category: 'Ethiopian',
          image: 'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=600',
          portions: [
            { name: 'Standard (Leb-Leb)', price: 390, isDefault: true },
            { name: 'Special with Ayib & Gomen', price: 450, isDefault: false },
          ],
          extras: [
            { name: 'Extra Spiced Butter (Kibbeh)', price: 45 },
            { name: 'Kocho Flatbread', price: 40 },
          ],
          spiceLevel: 'Very Hot',
          isFasting: false,
          isAvailable: true,
          kitchenStation: 'Traditional Stew Station',
          preparationTimeMinutes: 15,
        },
        {
          name: 'Gourmet Double Cheese Burger',
          description: 'Double beef patties, melted cheddar, pickles, crisp lettuce & burger sauce',
          price: 220,
          category: 'Burger',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
          portions: [
            { name: 'Single Patty', price: 180, isDefault: false },
            { name: 'Double Deluxe', price: 220, isDefault: true },
          ],
          extras: [
            { name: 'Extra Cheddar Cheese', price: 35 },
            { name: 'Crispy Beef Bacon', price: 50 },
            { name: 'French Fries Side', price: 60 },
          ],
          spiceLevel: 'Mild',
          isFasting: false,
          isAvailable: true,
          kitchenStation: 'Burger & Fryer Station',
          preparationTimeMinutes: 15,
        },
        {
          name: 'Margherita Wood-Fired Pizza',
          description: 'Italian mozzarella, San Marzano tomato puree & aromatic basil leaves',
          price: 320,
          category: 'Pizza',
          image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600',
          portions: [
            { name: 'Medium (10 inch)', price: 320, isDefault: true },
            { name: 'Large (14 inch)', price: 420, isDefault: false },
          ],
          extras: [
            { name: 'Extra Fresh Mozzarella', price: 50 },
            { name: 'Black Olives & Mushrooms', price: 40 },
          ],
          spiceLevel: 'Mild',
          isFasting: false,
          isAvailable: true,
          kitchenStation: 'Pizza Oven Station',
          preparationTimeMinutes: 18,
        },
        {
          name: 'Fresh Shiro Tegabino',
          description: 'Rich slow-simmered chickpea flour stew served bubbling hot in clay pot',
          price: 180,
          category: 'Ethiopian',
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
          portions: [
            { name: 'Regular Tegabino', price: 180, isDefault: true },
            { name: 'Special Shiro Bozena (with meat)', price: 260, isDefault: false },
          ],
          extras: [
            { name: 'Extra Chili Peppers', price: 15 },
            { name: 'Salad Side', price: 30 },
          ],
          spiceLevel: 'Medium',
          isFasting: true,
          isAvailable: true,
          kitchenStation: 'Traditional Stew Station',
          preparationTimeMinutes: 12,
        },
      ];

      await Food.insertMany(sampleFoods);
      console.log(`✅ ${sampleFoods.length} customized food items created`);
    }

    console.log('\n🎉 FoodHub ERP Database Seeded Successfully!');
    console.log('====================================================');
    console.log('📌 Organization: FoodHub Restaurant Group');
    console.log('📌 Branches: Haramaya Branch (HRM-01) & Bole Branch (BOL-01)');
    console.log('📌 Dine-in Tables: Table 01 - Table 05 with active QR tokens');
    console.log('📌 Admin Login: admin@foodhub.com / admin123');
    console.log('====================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

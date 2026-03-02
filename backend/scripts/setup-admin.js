const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');
const MenuItem = require('../src/models/MenuItem');
const Order = require('../src/models/Order');

dotenv.config({ path: path.join(__dirname, '../.env') });

const setupAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📡 Connected to MongoDB...');

        // Step 1: Clear all sample restaurants, menu items, and orders
        const deletedRestaurants = await Restaurant.deleteMany({});
        const deletedMenuItems = await MenuItem.deleteMany({});
        const deletedOrders = await Order.deleteMany({});
        console.log(`🧹 Cleared ${deletedRestaurants.deletedCount} restaurants`);
        console.log(`🧹 Cleared ${deletedMenuItems.deletedCount} menu items`);
        console.log(`🧹 Cleared ${deletedOrders.deletedCount} orders`);

        // Step 2: Create admin account
        let admin = await User.findOne({ email: 'admin@nextplate.com' });

        if (admin) {
            console.log('👤 Admin account already exists');
        } else {
            admin = await User.create({
                fullName: 'NextPlate Admin',
                email: 'admin@nextplate.com',
                password: 'Admin@123',
                role: 'admin',
                isEmailVerified: true,
            });
            console.log('✅ Admin account created successfully!');
        }

        console.log('\n========================================');
        console.log('🔐 ADMIN CREDENTIALS');
        console.log('========================================');
        console.log('📧 Email:    admin@nextplate.com');
        console.log('🔑 Password: Admin@123');
        console.log('========================================');
        console.log('\n✨ Setup completed! You can now:');
        console.log('1. Login to the web portal admin panel');
        console.log('2. Register new restaurants from the admin panel');
        console.log('3. Restaurants will appear in the Flutter app');

        process.exit(0);
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
};

setupAdmin();

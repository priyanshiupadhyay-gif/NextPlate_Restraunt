const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function seedDemo() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const User = require('../src/models/User');
        const Restaurant = require('../src/models/Restaurant');
        const MenuItem = require('../src/models/MenuItem');

        // Create Demo Owner if not exists
        let owner = await User.findOne({ email: 'demo-owner@nextplate.com' });
        if (!owner) {
            owner = await User.create({
                fullName: 'Demo Node Owner',
                email: 'demo-owner@nextplate.com',
                password: 'password123',
                role: 'restaurant',
                isEmailVerified: true
            });
            console.log('Created Demo Owner');
        }

        // Create Seed Restaurant with specific ID for CheckoutPage mapping
        const demoRestId = '699e597fc02b23a16c79ad5e';
        let restaurant = await Restaurant.findById(demoRestId);
        if (!restaurant) {
            restaurant = await Restaurant.create({
                _id: demoRestId,
                name: 'Seed Node (Simulator)',
                ownerId: owner._id,
                address: {
                    street: '123 Grid Way',
                    city: 'Global Grid',
                    state: 'Internet',
                    zipCode: '000000',
                    location: {
                        type: 'Point',
                        coordinates: [77.5946, 12.9716] // Bangalore
                    }
                },
                contactPhone: '+919999999999',
                cuisine: ['Simulator'],
                isVerified: true,
                isActive: true
            });
            console.log('Created Seed Restaurant');
        }

        // Create Seed Item with specific ID for CheckoutPage mapping
        const demoItemId = '699e597fc02b23a16c79ad61';
        let item = await MenuItem.findById(demoItemId);
        if (!item) {
            item = await MenuItem.create({
                _id: demoItemId,
                name: 'Seeded Data-Packet',
                description: 'A universal surplus item for simulator testing.',
                category: 'prepared_meals',
                originalPrice: 100,
                discountedPrice: 30,
                availableQuantity: 999,
                isAvailable: true,
                restaurantId: restaurant._id,
                isApproved: true
            });
            console.log('Created Seed Item');
        }

        console.log('Seeding Complete!');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Seeding Error:', err);
    }
}

seedDemo();

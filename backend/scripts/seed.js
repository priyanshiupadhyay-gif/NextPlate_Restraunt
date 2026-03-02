const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');
const MenuItem = require('../src/models/MenuItem');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📡 Connected to MongoDB for seeding...');

        // Clean existing data (Optional, but good for fresh seed)
        await Restaurant.deleteMany({});
        await MenuItem.deleteMany({});
        console.log('🧹 Cleaned existing Restaurant and MenuItem data');

        // Find or Create a default owner
        let owner = await User.findOne({ email: 'urjitupadhyayuu@gmail.com' });
        if (!owner) {
            owner = await User.create({
                fullName: 'Urjit Upadhyay',
                email: 'urjitupadhyayuu@gmail.com',
                isEmailVerified: true,
                role: 'restaurant'
            });
            console.log('👤 Created default owner user');
        }

        const restaurants = [
            {
                name: 'La Petite Boulangerie',
                description: 'Traditional French bakery specializing in sourdough breads and artisanal pastries. Saving today\'s golden crusts.',
                cuisine: ['Bakery', 'French', 'Desserts'],
                address: {
                    street: '12 Baker Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400001',
                    location: { type: 'Point', coordinates: [72.8777, 19.0760] }
                },
                contactPhone: '+91 9876543210',
                rating: 4.9,
                ownerId: owner._id,
                isActive: true,
                isVerified: true,
                images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1000']
            },
            {
                name: 'The Green Table',
                description: 'Farm-to-table organic vegan kitchen. We turn surplus seasonal harvest into gourmet plant-based experiences.',
                cuisine: ['Organic', 'Vegan', 'Healthy'],
                address: {
                    street: '45 Eco Garden',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400053',
                    location: { type: 'Point', coordinates: [72.8358, 19.1136] }
                },
                contactPhone: '+91 9876543211',
                rating: 4.7,
                ownerId: owner._id,
                isActive: true,
                isVerified: true,
                images: ['https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1000']
            },
            {
                name: 'Artisan Roast',
                description: 'Specialty coffee house and artisanal brunch spot. Every bean tells a story of sustainability.',
                cuisine: ['Cafe', 'Brunch', 'Beverages'],
                address: {
                    street: '88 Coffee Lane',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400005',
                    location: { type: 'Point', coordinates: [72.8150, 18.9067] }
                },
                contactPhone: '+91 9876543212',
                rating: 4.8,
                ownerId: owner._id,
                isActive: true,
                isVerified: true,
                images: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1000']
            },
            {
                name: 'Rustic Roots',
                description: 'Traditional Indian flavors meets modern sustainability. Experience heritage recipes with zero waste.',
                cuisine: ['North Indian', 'Tandoor', 'Heritage'],
                address: {
                    street: '12 Heritage Way',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400092',
                    location: { type: 'Point', coordinates: [72.8567, 19.2297] }
                },
                contactPhone: '+91 9876543213',
                rating: 4.6,
                ownerId: owner._id,
                isActive: true,
                isVerified: true,
                images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000']
            },
            {
                name: 'Ocean harvested',
                description: 'Ethically sourced seafood. Fresh catches from local shores, prepared with artisanal care.',
                cuisine: ['Seafood', 'Coastal', 'Grill'],
                address: {
                    street: '7 Coastal Port',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400050',
                    location: { type: 'Point', coordinates: [72.8333, 19.0544] }
                },
                contactPhone: '+91 9876543214',
                rating: 4.5,
                ownerId: owner._id,
                isActive: true,
                isVerified: true,
                images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=1000']
            }
        ];

        const createdRestaurants = await Restaurant.create(restaurants);
        console.log(`✅ Seeded ${createdRestaurants.length} restaurants`);

        const menuItems = [
            {
                restaurantId: createdRestaurants[0]._id,
                name: 'Sourdough Baguette',
                description: 'Freshly baked traditional sourdough with a perfect crust.',
                category: 'breads',
                originalPrice: 150,
                discountedPrice: 60,
                availableQuantity: 10,
                isVegetarian: true,
                isVegan: true,
                isApproved: true,
                pickupTimeSlots: [{ startTime: '18:00', endTime: '20:00' }],
                images: ['https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&q=80&w=1000']
            },
            {
                restaurantId: createdRestaurants[1]._id,
                name: 'Avocado Artisan Toast',
                description: 'Crushed avocado on multi-grain bread with micro-greens.',
                category: 'mains',
                originalPrice: 350,
                discountedPrice: 140,
                availableQuantity: 5,
                isVegetarian: true,
                isVegan: true,
                isApproved: true,
                pickupTimeSlots: [{ startTime: '17:00', endTime: '19:00' }],
                images: ['https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=1000']
            },
            {
                restaurantId: createdRestaurants[2]._id,
                name: 'Lavender Cold Brew',
                description: '12-hour steeped cold brew with organic lavender hints.',
                category: 'beverages',
                originalPrice: 280,
                discountedPrice: 120,
                availableQuantity: 15,
                isVegetarian: true,
                isVegan: true,
                isApproved: true,
                pickupTimeSlots: [{ startTime: '16:00', endTime: '18:00' }],
                images: ['https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=1000']
            },
            {
                restaurantId: createdRestaurants[3]._id,
                name: 'Heritage Dal Makhani',
                description: 'Slow-cooked black lentils prepared with traditional clay pots.',
                category: 'mains',
                originalPrice: 450,
                discountedPrice: 200,
                availableQuantity: 8,
                isVegetarian: true,
                isApproved: true,
                pickupTimeSlots: [{ startTime: '20:00', endTime: '22:00' }],
                images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=1000']
            },
            {
                restaurantId: createdRestaurants[4]._id,
                name: 'Grilled Sea Bass',
                description: 'Local sea bass grilled with lemon butter and herbs.',
                category: 'mains',
                originalPrice: 950,
                discountedPrice: 450,
                availableQuantity: 4,
                isVegetarian: false,
                isApproved: true,
                pickupTimeSlots: [{ startTime: '19:00', endTime: '21:00' }],
                images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=1000']
            }
        ];

        await MenuItem.create(menuItems);
        console.log(`✅ Seeded ${menuItems.length} menu items`);

        console.log('✨ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedData();

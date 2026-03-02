/**
 * Seed 5 Menu Items for Each Restaurant
 * 
 * This script connects directly to MongoDB, finds all restaurants,
 * and adds 5 realistic menu items to each one.
 * 
 * Usage: node scripts/seed-menu-items.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MenuItem = require('../src/models/MenuItem');
const Restaurant = require('../src/models/Restaurant');

// ─── Menu Item Templates ───
// Each restaurant type gets appropriate dishes
const INDIAN_ITEMS = [
    {
        name: 'Paneer Butter Masala with Naan',
        description: 'Creamy paneer in rich tomato-cashew gravy served with 2 butter naan. Freshly prepared, best consumed within 4 hours.',
        category: 'prepared_meals',
        originalPrice: 280,
        discountedPrice: 120,
        availableQuantity: 8,
        dietaryInfo: ['vegetarian'],
        carbonScore: 1.8,
        waterSaved: 650,
        images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'Chicken Biryani (Family Pack)',
        description: 'Fragrant basmati rice layered with tender chicken pieces, slow-cooked dum style. Serves 3-4 people.',
        category: 'prepared_meals',
        originalPrice: 450,
        discountedPrice: 180,
        availableQuantity: 5,
        dietaryInfo: [],
        carbonScore: 3.2,
        waterSaved: 1100,
        images: ['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'Mixed Veg Thali (Complete Meal)',
        description: 'Dal, sabzi, rice, 3 rotis, raita, salad and pickle. A balanced wholesome meal.',
        category: 'prepared_meals',
        originalPrice: 200,
        discountedPrice: 85,
        availableQuantity: 12,
        dietaryInfo: ['vegetarian', 'gluten-free'],
        carbonScore: 1.2,
        waterSaved: 800,
        images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'Masala Dosa with Chutney & Sambar',
        description: 'Crispy golden dosa stuffed with spiced potato filling. Served with coconut chutney and sambar.',
        category: 'prepared_meals',
        originalPrice: 150,
        discountedPrice: 60,
        availableQuantity: 15,
        dietaryInfo: ['vegetarian', 'vegan'],
        carbonScore: 0.8,
        waterSaved: 400,
        images: ['https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'Gulab Jamun Box (12 pieces)',
        description: 'Soft, melt-in-mouth gulab jamuns soaked in rose-cardamom syrup. Perfect for sharing.',
        category: 'bakery',
        originalPrice: 180,
        discountedPrice: 70,
        availableQuantity: 10,
        dietaryInfo: ['vegetarian'],
        carbonScore: 0.5,
        waterSaved: 300,
        images: ['https://images.unsplash.com/photo-1666190073498-2ef0dddd8b92?auto=format&fit=crop&q=80&w=800'],
    },
];

const AMERICAN_ITEMS = [
    {
        name: 'Classic Cheeseburger Combo',
        description: 'Angus beef patty with aged cheddar, lettuce, tomato, and secret sauce. Served with fries and a drink.',
        category: 'prepared_meals',
        originalPrice: 15,
        discountedPrice: 6,
        availableQuantity: 10,
        dietaryInfo: [],
        carbonScore: 2.5,
        waterSaved: 900,
        images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'Margherita Pizza (Large)',
        description: 'Hand-tossed pizza with San Marzano tomato sauce, fresh mozzarella, and basil. 14 inch.',
        category: 'prepared_meals',
        originalPrice: 18,
        discountedPrice: 7,
        availableQuantity: 6,
        dietaryInfo: ['vegetarian'],
        carbonScore: 1.8,
        waterSaved: 700,
        images: ['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'Caesar Salad with Grilled Chicken',
        description: 'Crisp romaine, parmesan, croutons, and grilled chicken breast with house-made Caesar dressing.',
        category: 'prepared_meals',
        originalPrice: 14,
        discountedPrice: 5,
        availableQuantity: 8,
        dietaryInfo: [],
        carbonScore: 1.0,
        waterSaved: 500,
        images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'Chocolate Lava Cake (2 pack)',
        description: 'Warm dark chocolate cake with molten center. Dusted with powdered sugar. Reheat for 30 seconds.',
        category: 'bakery',
        originalPrice: 12,
        discountedPrice: 4,
        availableQuantity: 12,
        dietaryInfo: ['vegetarian'],
        carbonScore: 0.6,
        waterSaved: 350,
        images: ['https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'BBQ Pulled Pork Sandwich',
        description: 'Slow-smoked pulled pork with tangy BBQ sauce, coleslaw, and pickles on a brioche bun.',
        category: 'prepared_meals',
        originalPrice: 16,
        discountedPrice: 6,
        availableQuantity: 7,
        dietaryInfo: [],
        carbonScore: 2.8,
        waterSaved: 1000,
        images: ['https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&q=80&w=800'],
    },
];

const GENERIC_ITEMS = [
    {
        name: 'Grilled Veggie Wrap',
        description: 'Roasted vegetables, hummus, fresh greens, and feta cheese wrapped in a whole wheat tortilla.',
        category: 'prepared_meals',
        originalPrice: 10,
        discountedPrice: 4,
        availableQuantity: 10,
        dietaryInfo: ['vegetarian'],
        carbonScore: 0.7,
        waterSaved: 400,
        images: ['https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'Pasta Alfredo with Garlic Bread',
        description: 'Penne pasta in creamy Alfredo sauce with mushrooms and herbs. Served with toasted garlic bread.',
        category: 'prepared_meals',
        originalPrice: 12,
        discountedPrice: 5,
        availableQuantity: 8,
        dietaryInfo: ['vegetarian'],
        carbonScore: 1.2,
        waterSaved: 550,
        images: ['https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'Fresh Fruit Smoothie Bowl',
        description: 'Acai and banana base topped with granola, fresh berries, coconut flakes, and chia seeds.',
        category: 'combos',
        originalPrice: 9,
        discountedPrice: 3,
        availableQuantity: 14,
        dietaryInfo: ['vegan', 'gluten-free'],
        carbonScore: 0.4,
        waterSaved: 300,
        images: ['https://images.unsplash.com/photo-1590301157284-4e08f9af496b?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'Assorted Sandwich Platter (6 pcs)',
        description: 'Mix of club sandwiches, panini, and wraps. Perfect for group meals or parties.',
        category: 'combos',
        originalPrice: 25,
        discountedPrice: 10,
        availableQuantity: 5,
        dietaryInfo: [],
        carbonScore: 1.5,
        waterSaved: 650,
        images: ['https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800'],
    },
    {
        name: 'Freshly Baked Muffin Box (4 pcs)',
        description: 'Assorted flavors: blueberry, chocolate chip, banana walnut, and lemon poppy seed.',
        category: 'bakery',
        originalPrice: 8,
        discountedPrice: 3,
        availableQuantity: 18,
        dietaryInfo: ['vegetarian'],
        carbonScore: 0.3,
        waterSaved: 250,
        images: ['https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=800'],
    },
];

const seedMenuItems = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📡 Connected to MongoDB...\n');

        // Find all restaurants
        const restaurants = await Restaurant.find({}).lean();
        console.log(`🏪 Found ${restaurants.length} restaurant(s)\n`);

        if (restaurants.length === 0) {
            console.log('❌ No restaurants found! Register some restaurants first.');
            process.exit(0);
        }

        let totalCreated = 0;

        for (const restaurant of restaurants) {
            console.log(`\n🍽️  ${restaurant.name} (${restaurant.address?.city || 'Unknown City'})`);
            console.log(`   ID: ${restaurant._id}`);
            console.log(`   Verified: ${restaurant.isVerified ? '✅ Yes' : '❌ No'}`);

            // Check existing items
            const existingCount = await MenuItem.countDocuments({ restaurantId: restaurant._id });
            if (existingCount >= 5) {
                console.log(`   ⏭️  Already has ${existingCount} items, skipping...`);
                continue;
            }

            // Choose items based on location/name
            const city = (restaurant.address?.city || '').toLowerCase();
            const country = (restaurant.address?.country || '').toLowerCase();
            const name = restaurant.name.toLowerCase();

            let itemTemplates;
            if (country.includes('india') || city.includes('delhi') || city.includes('mumbai') || city.includes('bangalore') || name.includes('desi') || name.includes('indian') || name.includes('masala')) {
                itemTemplates = INDIAN_ITEMS;
                console.log('   📍 Using Indian menu items');
            } else if (country.includes('us') || country.includes('united states') || city.includes('new york') || city.includes('chicago') || city.includes('los angeles') || city.includes('san francisco')) {
                itemTemplates = AMERICAN_ITEMS;
                console.log('   📍 Using American menu items');
            } else {
                itemTemplates = GENERIC_ITEMS;
                console.log('   📍 Using Global menu items');
            }

            // Create items that don't already exist
            const itemsToCreate = 5 - existingCount;
            const templates = itemTemplates.slice(0, itemsToCreate);

            for (const template of templates) {
                const expiryTime = new Date(Date.now() + (3 + Math.random() * 5) * 60 * 60 * 1000); // 3-8 hours from now

                const item = await MenuItem.create({
                    ...template,
                    restaurantId: restaurant._id,
                    isApproved: true,
                    isAvailable: true,
                    isDonationEligible: Math.random() > 0.5, // Random 50% chance
                    expiryTime,
                    pickupTimeSlots: [{
                        startTime: '12:00',
                        endTime: '15:00',
                        maxOrders: 10
                    }],
                });

                console.log(`   ✅ Added: ${item.name} (₹${item.discountedPrice}/${item.originalPrice})`);
                totalCreated++;
            }
        }

        console.log(`\n${'═'.repeat(50)}`);
        console.log(`🎉 Done! Created ${totalCreated} menu items across ${restaurants.length} restaurant(s).`);
        console.log(`${'═'.repeat(50)}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedMenuItems();

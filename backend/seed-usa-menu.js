
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MenuItem = require('./src/models/MenuItem');
const Restaurant = require('./src/models/Restaurant');

const restaurantsToSeed = [
    '69a52819be3d228ad1342d77', // Global Bites
    '69a5311dbe3d228ad1342f85', // Palm Royal
    '69a537f27d14656fb3dca659', // Fresh Roots Kitchen
    '69a54549be3d228ad13434ae', // HomeTown Rescue
    '69a5486b0a1b15f92596e330'  // Nourish & Share
];

const dishes = [
    {
        name: 'Truffle Mushroom Risotto',
        category: 'mains',
        description: 'Waste_Off: 14kg | Creamy Arborio rice with wild mushrooms and truffle oil.',
        originalPrice: 34,
        discountedPrice: 10,
        availableQuantity: 5,
        carbonScore: 14, // Using requested "14kg" here as carbon score for impact
        isDonationEligible: true,
        isApproved: true,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=2070&auto=format&fit=crop']
    },
    {
        name: 'Seeded Data-Packet',
        category: 'appetizers',
        description: 'Waste_Off: 1.5kg | Unique digital-themed appetizer with savory filling.',
        originalPrice: 100,
        discountedPrice: 30,
        availableQuantity: 3,
        carbonScore: 1.5,
        isDonationEligible: true,
        isApproved: true,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=2070&auto=format&fit=crop']
    },
    {
        name: 'Gulab Jamun Box (12 pieces)',
        category: 'desserts',
        description: 'Waste_Off: 0.5kg | Traditional sweet milk dumplings in sugar syrup.',
        originalPrice: 180,
        discountedPrice: 70,
        availableQuantity: 10,
        carbonScore: 0.5,
        isDonationEligible: true,
        isApproved: true,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1549413982-f5446050bada?q=80&w=2070&auto=format&fit=crop']
    },
    {
        name: 'Masala Dosa with Chutney & Sambar',
        category: 'mains',
        description: 'Waste_Off: 0.8kg | Crispy rice crepe filled with spiced potato mash.',
        originalPrice: 150,
        discountedPrice: 60,
        availableQuantity: 8,
        carbonScore: 0.8,
        isDonationEligible: true,
        isApproved: true,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=2070&auto=format&fit=crop']
    },
    {
        name: 'Chicken Biryani (Family Pack)',
        category: 'mains',
        description: 'Waste_Off: 3.2kg | Fragrant basmati rice layered with spiced chicken.',
        originalPrice: 450,
        discountedPrice: 180,
        availableQuantity: 4,
        carbonScore: 3.2,
        isDonationEligible: true,
        isApproved: true,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?q=80&w=2070&auto=format&fit=crop']
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const restaurantId of restaurantsToSeed) {
            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) {
                console.log(`Restaurant ${restaurantId} not found`);
                continue;
            }

            console.log(`Seeding for: ${restaurant.name} (${restaurant.email})`);

            // Clear existing menu items for these test restaurants
            await MenuItem.deleteMany({ restaurantId });

            const itemsToInsert = dishes.map(dish => ({
                ...dish,
                restaurantId,
                expiryTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3h as per prompt
                tags: [dish.category, 'Rescue', 'USA-Data']
            }));

            await MenuItem.insertMany(itemsToInsert);
            console.log(`Inserted 5 items for ${restaurant.name}`);
        }

        console.log('Seeding completed successfully');
    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seed();

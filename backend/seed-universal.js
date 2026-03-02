const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Restaurant = require('./src/models/Restaurant');
const MenuItem = require('./src/models/MenuItem');
const User = require('./src/models/User');

const seedUniversal = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Grid...');

        // 1. Find or Create a Restaurateur User (if none exists)
        let restaurateur = await User.findOne({ role: 'restaurant' });
        if (!restaurateur) {
            console.log('No restaurant user found. Run registration first.');
            process.exit(1);
        }

        // 2. Clear existing demo items if any
        await MenuItem.deleteMany({ name: { $in: ['Artisanal Sushi Platter (12 pcs)', 'Freshly Baked Croissants (Pack of 4)', 'Farm-to-Table Veg Thali', 'Avocado Toast Box (3 units)'] } });

        // 3. Find or Create the "Global Simulator Node"
        let simulatorNode = await Restaurant.findOne({ name: 'Simulator Grid Node' });
        if (!simulatorNode) {
            simulatorNode = await Restaurant.create({
                ownerId: restaurateur._id,
                name: 'Simulator Grid Node',
                description: 'A global routing node for surplus liquidation testing.',
                logo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
                contactPhone: '+1234567890',
                address: {
                    street: '101 Grid Way',
                    city: 'Sydney',
                    state: 'NSW',
                    country: 'Australia',
                    zipCode: '2000',
                    location: { type: 'Point', coordinates: [151.2093, -33.8688] }
                },
                cuisine: ['Global', 'Bakery', 'Sushi'],
                isActive: true,
                isVerified: true
            });
            console.log('Created Simulator Node:', simulatorNode._id);
        }

        // 4. Create real menu items
        const items = [
            {
                restaurantId: simulatorNode._id,
                name: 'Freshly Baked Croissants (Pack of 4)',
                description: 'Hand-laminated buttery croissants from Le Grand Boulangerie.',
                category: 'bakery',
                originalPrice: 12,
                discountedPrice: 4,
                availableQuantity: 20,
                isAvailable: true,
                carbonScore: 0.9,
                waterSaved: 643,
                zone: 'Paris',
                imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800'
            },
            {
                restaurantId: simulatorNode._id,
                name: 'Artisanal Sushi Platter (12 pcs)',
                description: 'Sustainable ocean-sourced sushi assortment.',
                category: 'mains',
                originalPrice: 45,
                discountedPrice: 15,
                availableQuantity: 15,
                isAvailable: true,
                carbonScore: 4.2,
                waterSaved: 1200,
                zone: 'New York',
                imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800'
            },
            {
                restaurantId: simulatorNode._id,
                name: 'Farm-to-Table Veg Thali',
                description: 'Complete organic balanced meal.',
                category: 'prepared_meals',
                originalPrice: 600,
                discountedPrice: 240,
                availableQuantity: 10,
                isAvailable: true,
                carbonScore: 1.8,
                waterSaved: 900,
                zone: 'Delhi NCR',
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'
            },
            {
                restaurantId: simulatorNode._id,
                name: 'Avocado Toast Box (3 units)',
                description: 'Surplus sourdough and organic hass avocados.',
                category: 'combos',
                originalPrice: 32,
                discountedPrice: 10,
                availableQuantity: 25,
                isAvailable: true,
                carbonScore: 1.2,
                waterSaved: 400,
                zone: 'Sydney',
                imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800'
            }
        ];

        const createdItems = await MenuItem.insertMany(items);
        console.log(`Successfully seeded ${createdItems.length} universal nodes.`);

        console.log('--- SEEDED DATA (Copy these IDs if needed) ---');
        createdItems.forEach(i => console.log(`${i.name}: ${i._id} [REST: ${i.restaurantId}]`));

        process.exit(0);
    } catch (error) {
        console.error('Seeding parity failure:', error);
        process.exit(1);
    }
};

seedUniversal();

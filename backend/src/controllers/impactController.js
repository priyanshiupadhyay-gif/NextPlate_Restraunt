const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const logger = require('../utils/logger');

// @desc    Get global impact stats (all users)
// @route   GET /api/impact/stats
// @access  Public
exports.getGlobalImpact = async (req, res) => {
    try {
        const completedOrders = await Order.find({ orderStatus: 'completed' });

        let totalMealsRescued = 0;
        let totalCO2Saved = 0;
        let totalMoneySaved = 0;

        completedOrders.forEach(order => {
            totalMealsRescued += order.items.reduce((acc, item) => acc + item.quantity, 0);
            totalMoneySaved += order.discountAmount || 0;

            // Use actual totalCarbonSaved if available, otherwise fall back to estimate
            if (order.totalCarbonSaved > 0) {
                totalCO2Saved += order.totalCarbonSaved;
            } else {
                // Fallback: 0.8kg CO2 per meal
                const mealsInOrder = order.items.reduce((acc, item) => acc + item.quantity, 0);
                totalCO2Saved += (mealsInOrder * 0.8);
            }
        });

        totalCO2Saved = parseFloat(totalCO2Saved).toFixed(2);

        const activeNGOs = await User.countDocuments({ role: 'ngo', isVerifiedNGO: true });
        const participatingRestaurants = await User.countDocuments({ role: 'restaurant' });

        res.status(200).json({
            success: true,
            data: {
                totalMealsRescued,
                totalCO2Saved: `${totalCO2Saved}kg`,
                totalMoneySaved: `$${Math.round(totalMoneySaved)}`, // Standardized to $
                networkResilience: {
                    activeNGOs,
                    participatingRestaurants
                },
                timestamp: new Date()
            }
        });
    } catch (error) {
        logger.error('Global impact stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch global impact statistics'
        });
    }
};

// @desc    Get donation-ready items for NGOs
// @route   GET /api/impact/donations
// @access  Public
exports.getDonationItems = async (req, res) => {
    try {
        const donationItems = await MenuItem.find({
            isDonationEligible: true,
            isAvailable: true,
            isApproved: true,
            availableQuantity: { $gt: 0 }
        }).populate('restaurantId', 'name address contactEmail');

        res.status(200).json({
            success: true,
            count: donationItems.length,
            data: donationItems
        });
    } catch (error) {
        logger.error('Get donation items error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch donation items'
        });
    }
};

/**
 * @desc    Get network nodes (Restaurants with surplus and NGOs) for Live Map
 * @route   GET /api/impact/nodes
 * @access  Public
 */
exports.getNetworkNodes = async (req, res) => {
    try {
        // 1. Fetch Restaurants (Exclude Seed/Simulator/Test nodes)
        const testFilters = /seed|simulator|test|demo|asdf|qwer|werty|zxcv/i;
        const restaurants = await Restaurant.find({
            isActive: true,
            name: { $not: testFilters }
        }).select('name address ratings rating totalOrders ownerId');

        const activeItems = await MenuItem.find({ isAvailable: true, availableQuantity: { $gt: 0 } }).select('restaurantId availableQuantity carbonScore');

        const restaurantNodes = restaurants.map(r => {
            const items = activeItems.filter(i => i.restaurantId.toString() === r._id.toString());
            const totalQuantity = items.reduce((acc, i) => acc + i.availableQuantity, 0);
            const co2Saved = items.reduce((acc, i) => acc + (i.carbonScore || 0.8) * i.availableQuantity, 0).toFixed(1);

            // Coordinates fallback only for basic positioning if not set, no random drift
            const lng = r.address?.location?.coordinates?.[0] || 77.2;
            const lat = r.address?.location?.coordinates?.[1] || 28.6;

            return {
                id: r._id,
                name: r.name,
                type: 'restaurant',
                city: r.address?.city || 'India',
                lng,
                lat,
                items: totalQuantity,
                co2: parseFloat(co2Saved)
            };
        });

        // 2. Fetch NGOs (Exclude Seed/Simulator/Test)
        const ngos = await User.find({
            role: 'ngo',
            isVerifiedNGO: true,
            $and: [
                { ngoName: { $not: testFilters } },
                { fullName: { $not: testFilters } }
            ]
        }).select('fullName ngoName totalMealsRescued ngoAddress');

        const ngoNodes = ngos.map(n => {
            return {
                id: n._id,
                name: n.ngoName || n.fullName,
                type: 'ngo',
                city: n.ngoAddress?.split(',').slice(-1)[0]?.trim() || 'India',
                lng: 77.2,
                lat: 28.6,
                meals: n.totalMealsRescued || 0
            };
        });

        res.status(200).json({
            success: true,
            data: [...restaurantNodes, ...ngoNodes]
        });
    } catch (error) {
        logger.error('Get network nodes error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch network nodes' });
    }
};

/**
 * @desc    Get recent rescues for Live Ticker
 * @route   GET /api/impact/recent-rescues
 * @access  Public
 */
exports.getRecentRescues = async (req, res) => {
    try {
        const recentOrders = await Order.find({ orderStatus: 'completed' })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('restaurantId', 'name address contactEmail');

        const tickerData = recentOrders.map(order => {
            const timeDiff = Math.floor((new Date() - order.createdAt) / 60000); // in minutes
            return {
                time: timeDiff < 1 ? 'Just now' : `${timeDiff}m ago`,
                item: order.items[0]?.name || 'Rescue Pack',
                from: order.restaurantId?.name || 'Local Kitchen',
                city: order.restaurantId?.address?.city || 'India',
                co2: order.totalCarbonSaved || 0.8
            };
        });

        res.status(200).json({
            success: true,
            data: tickerData
        });
    } catch (error) {
        logger.error('Get recent rescues error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch recent rescues' });
    }
};

/**
 * @desc    Get community sponsorship stats and activity
 * @route   GET /api/impact/community
 * @access  Public
 */
exports.getCommunityImpact = async (req, res) => {
    try {
        const testFilters = /seed|simulator|test|demo|asdf|qwer|werty|zxcv/i;

        const totalSponsored = await Order.countDocuments({
            specialInstructions: { $regex: /SPONSORED/i }
        });

        const recentSponsors = await Order.find({
            specialInstructions: { $regex: /SPONSORED/i }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'fullName')
            .populate('restaurantId', 'name address');

        const activity = recentSponsors.map(order => {
            const timeDiff = Math.floor((new Date() - order.createdAt) / 60000);
            return {
                name: order.customerId?.fullName || 'Anonymous',
                item: order.items[0]?.name || 'Meal Pack',
                city: order.restaurantId?.address?.city || 'India',
                time: timeDiff < 1 ? 'Just now' : `${timeDiff}m ago`,
                message: order.specialInstructions?.split('"')[1] || ''
            };
        });

        res.status(200).json({
            success: true,
            data: {
                totalSponsored,
                recentSponsors: activity,
                activeCities: 1
            }
        });
    } catch (error) {
        logger.error('Get community impact error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch community stats' });
    }
};

// @desc    Get leaderboard rankings from real data
// @route   GET /api/impact/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
    try {
        const { category = 'overall' } = req.query;

        // --- Restaurant rankings ---
        const restaurants = await Restaurant.find({ isActive: true })
            .select('name totalOrders rating ownerId')
            .sort({ totalOrders: -1 })
            .limit(10)
            .lean();

        const restaurantEntries = restaurants.map((r, i) => ({
            id: r._id,
            name: r.name,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.name)}`,
            role: 'restaurant',
            score: (r.totalOrders || 0) * 100 + Math.round((r.rating || 0) * 50),
            impact: `${Math.round((r.totalOrders || 0) * 0.8)}kg CO₂`,
            rank: i + 1,
            trend: 'up',
            mealsRescued: r.totalOrders || 0
        }));

        // --- NGO rankings ---
        const ngos = await User.find({ role: 'ngo' })
            .select('fullName ngoName totalMealsRescued')
            .sort({ totalMealsRescued: -1 })
            .limit(10)
            .lean();

        const ngoEntries = ngos.map((n, i) => ({
            id: n._id,
            name: n.ngoName || n.fullName,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(n.ngoName || n.fullName)}`,
            role: 'ngo',
            score: (n.totalMealsRescued || 0) * 10,
            impact: `${n.totalMealsRescued || 0} Meals`,
            rank: i + 1,
            trend: 'up',
            mealsRescued: n.totalMealsRescued || 0
        }));

        // --- User rankings (by completed orders) ---
        const userAgg = await Order.aggregate([
            { $match: { orderStatus: 'completed' } },
            {
                $group: {
                    _id: '$customerId',
                    totalOrders: { $sum: 1 },
                    totalCO2: { $sum: { $ifNull: ['$totalCarbonSaved', 0.8] } },
                    totalSpent: { $sum: '$totalAmount' }
                }
            },
            { $sort: { totalOrders: -1 } },
            { $limit: 10 }
        ]);

        const userIds = userAgg.map(u => u._id);
        const users = await User.find({ _id: { $in: userIds } }).select('fullName').lean();
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u.fullName; });

        const userEntries = userAgg.map((u, i) => ({
            id: u._id,
            name: userMap[u._id?.toString()] || 'Anonymous Rescuer',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userMap[u._id?.toString()] || 'anon')}`,
            role: 'user',
            score: u.totalOrders * 200 + Math.round(u.totalCO2 * 50),
            impact: `${u.totalCO2.toFixed(1)}kg CO₂`,
            rank: i + 1,
            trend: 'up',
            mealsRescued: u.totalOrders
        }));

        // --- Build response based on category ---
        let result;
        if (category === 'restaurants') {
            result = restaurantEntries;
        } else if (category === 'ngos') {
            result = ngoEntries;
        } else {
            // Overall — merge all, sort by score
            const all = [...restaurantEntries, ...ngoEntries, ...userEntries]
                .sort((a, b) => b.score - a.score)
                .map((e, i) => ({ ...e, rank: i + 1 }));
            result = all.slice(0, 15);
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        logger.error('Leaderboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
    }
};

// @desc    Simulate activity for demo purposes
// @route   POST /api/impact/simulate
// @access  Public (demo only)
exports.simulateActivity = async (req, res) => {
    try {
        const { count = 5 } = req.body;
        const limited = Math.min(count, 20);

        // Get all restaurants
        const restaurants = await Restaurant.find({ isActive: true }).select('_id name').lean();
        if (restaurants.length === 0) {
            return res.status(400).json({ success: false, message: 'No restaurants found. Register restaurants first.' });
        }

        // Get all users (non-restaurant, non-admin)
        const users = await User.find({ role: { $in: ['user', 'ngo'] } }).select('_id fullName role').lean();
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'No users found. Register users first.' });
        }

        const itemNames = [
            'Paneer Tikka Platter', 'Veg Biryani Family Pack', 'Dal Makhani Bowl',
            'Butter Chicken Combo', 'Mixed Grill Box', 'Fresh Naan Basket',
            'Chole Bhature Set', 'Rajma Chawal Bowl', 'Masala Dosa Combo',
            'Idli Sambar Plate', 'Pav Bhaji Special', 'Samosa Party Pack',
            'Gulab Jamun Tray', 'Mango Lassi Jug', 'Tandoori Roti Bundle'
        ];

        const created = [];
        for (let i = 0; i < limited; i++) {
            const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
            const customer = users[Math.floor(Math.random() * users.length)];
            const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
            const qty = Math.floor(Math.random() * 4) + 1;
            const price = Math.floor(Math.random() * 300) + 50;
            const co2 = parseFloat((qty * (Math.random() * 1.2 + 0.5)).toFixed(2));

            const order = await Order.create({
                customerId: customer._id,
                restaurantId: restaurant._id,
                items: [{
                    name: itemName,
                    quantity: qty,
                    price: price,
                    originalPrice: price * 2
                }],
                totalAmount: price * qty,
                discountAmount: price * qty,
                orderStatus: 'completed',
                totalCarbonSaved: co2,
                paymentMethod: 'demo',
                deliveryAddress: { street: 'Demo Street', city: 'Mumbai', state: 'MH', zipCode: '400001' },
                completedAt: new Date(Date.now() - Math.random() * 7 * 86400000)
            });

            // Update restaurant order count
            await Restaurant.findByIdAndUpdate(restaurant._id, { $inc: { totalOrders: 1 } });

            // Update NGO meals if applicable
            if (customer.role === 'ngo') {
                await User.findByIdAndUpdate(customer._id, { $inc: { totalMealsRescued: qty } });
            }

            created.push({ orderId: order._id, item: itemName, restaurant: restaurant.name });
        }

        res.status(201).json({
            success: true,
            message: `Simulated ${created.length} rescue operations`,
            data: created
        });
    } catch (error) {
        logger.error('Simulate activity error:', error);
        res.status(500).json({ success: false, message: 'Simulation failed: ' + error.message });
    }
};

// @desc    Simulate a single rescue with specific data from the form
// @route   POST /api/impact/simulate-single
// @access  Public (demo only)
exports.simulateSingleActivity = async (req, res) => {
    try {
        const { restaurantId, customerId, itemName, quantity, price, co2 } = req.body;

        if (!restaurantId || !customerId || !itemName) {
            return res.status(400).json({ success: false, message: 'restaurantId, customerId, and itemName are required' });
        }

        const customer = await User.findById(customerId).select('role').lean();
        if (!customer) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const order = await Order.create({
            customerId,
            restaurantId,
            items: [{
                name: itemName,
                quantity: quantity || 1,
                price: price || 100,
                originalPrice: (price || 100) * 2
            }],
            totalAmount: (price || 100) * (quantity || 1),
            discountAmount: (price || 100) * (quantity || 1),
            orderStatus: 'completed',
            totalCarbonSaved: co2 || parseFloat(((quantity || 1) * 0.8).toFixed(2)),
            paymentMethod: 'demo',
            deliveryAddress: { street: 'Simulator', city: 'Mumbai', state: 'MH', zipCode: '400001' },
            completedAt: new Date()
        });

        await Restaurant.findByIdAndUpdate(restaurantId, { $inc: { totalOrders: 1 } });

        if (customer.role === 'ngo') {
            await User.findByIdAndUpdate(customerId, { $inc: { totalMealsRescued: quantity || 1 } });
        }

        res.status(201).json({
            success: true,
            message: `Rescued ${itemName} (x${quantity || 1})`,
            data: { orderId: order._id }
        });
    } catch (error) {
        logger.error('Simulate single error:', error);
        res.status(500).json({ success: false, message: 'Simulation failed: ' + error.message });
    }
};

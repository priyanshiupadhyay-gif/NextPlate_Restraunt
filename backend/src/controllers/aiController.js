const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const User = require('../models/User');
const geminiService = require('../services/geminiService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * @desc    Generate AI-powered rescue strategy based on expiring items
 * @route   GET /api/ai/rescue-strategy
 * @access  Public
 */
exports.getRescueStrategy = async (req, res) => {
    try {
        // Fetch items expiring in the next 12 hours
        const twelveHoursFromNow = new Date(Date.now() + 12 * 60 * 60 * 1000);
        const expiringItems = await MenuItem.find({
            expiryTime: { $lte: twelveHoursFromNow, $gt: new Date() },
            isAvailable: true,
            availableQuantity: { $gt: 0 }
        }).populate('restaurantId', 'name address');

        if (expiringItems.length === 0) {
            return res.status(200).json({
                success: true,
                message: "The neighborhood grid is currently stable. No surplus spikes detected.",
                data: null
            });
        }

        // Use Gemini AI to generate strategy
        const strategy = await geminiService.generateRescueStrategy(expiringItems);

        res.status(200).json({
            success: true,
            data: strategy
        });

    } catch (error) {
        logger.error('AI strategy error:', error);
        res.status(500).json({
            success: false,
            message: 'Neural rescue engine failed to harmonize neighborhood data'
        });
    }
};

/**
 * @desc    Generate AI meal plan for donation items
 * @route   POST /api/ai/meal-plan
 * @access  Public
 */
exports.getMealPlan = async (req, res) => {
    try {
        // Get all items marked for donation
        const donationItems = await MenuItem.find({
            isDonationEligible: true,
            isAvailable: true,
            availableQuantity: { $gt: 0 }
        }).populate('restaurantId', 'name address');

        if (donationItems.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No donation items currently available.',
                data: null
            });
        }

        const mealPlan = await geminiService.generateMealPlan(donationItems);

        res.status(200).json({
            success: true,
            data: {
                ...mealPlan,
                donationItems: donationItems.map(item => ({
                    id: item._id,
                    name: item.name,
                    quantity: item.availableQuantity,
                    category: item.category,
                    restaurant: item.restaurantId?.name,
                    expiryTime: item.expiryTime
                }))
            }
        });

    } catch (error) {
        logger.error('AI meal plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate meal plan'
        });
    }
};

/**
 * @desc    Restaurant marks unsold items for NGO donation
 * @route   PUT /api/restaurant/menu/:id/donate
 * @access  Private (Restaurant)
 */
exports.markForDonation = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'No restaurant associated with this account'
            });
        }

        const item = await MenuItem.findOne({
            _id: req.params.id,
            restaurantId: restaurant._id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        // Mark the item for donation
        item.isDonationEligible = true;
        item.discountedPrice = 0; // Free for NGOs
        await item.save();

        // Try to notify NGOs via email
        try {
            const ngos = await User.find({ role: 'ngo', isEmailVerified: true }).select('email fullName').limit(50);
            if (ngos.length > 0) {
                const emailPromises = ngos.map(ngo => {
                    const html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                            <h2 style="color: #EA580C; text-align: center;">🍽️ New Donation Available!</h2>
                            <p>Hi ${ngo.fullName},</p>
                            <p>A restaurant has marked surplus food for donation:</p>
                            <div style="background: #FFF8F0; border-radius: 10px; padding: 15px; margin: 15px 0;">
                                <h3 style="margin: 0; color: #1C1207;">${item.name}</h3>
                                <p style="margin: 5px 0; color: #666;">📦 Quantity: ${item.availableQuantity} portions</p>
                                <p style="margin: 5px 0; color: #666;">🏷️ Category: ${item.category}</p>
                                <p style="margin: 5px 0; color: #666;">🏪 From: ${restaurant.name}</p>
                                ${item.expiryTime ? `<p style="margin: 5px 0; color: #EA580C;">⏰ Pickup before: ${new Date(item.expiryTime).toLocaleString()}</p>` : ''}
                            </div>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="${process.env.FRONTEND_URL}/ngo" style="background-color: #1C1207; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Claim Now — $0</a>
                            </div>
                            <p style="font-size: 12px; color: #999; text-align: center;">This is an automated alert from NextPlate Resilience Network.</p>
                        </div>
                    `;

                    return emailService.sendViaSendGrid
                        ? require('../services/emailService').sendCustomEmail(ngo.email, `🍽️ Free Food: ${item.name} — ${item.availableQuantity} portions available`, html)
                        : Promise.resolve();
                });

                // Fire and forget — don't block the response
                Promise.allSettled(emailPromises).then(results => {
                    const sent = results.filter(r => r.status === 'fulfilled').length;
                    logger.info(`📧 Donation alert sent to ${sent}/${ngos.length} NGOs for item: ${item.name}`);
                });
            }
        } catch (emailError) {
            logger.warn('NGO notification email failed (non-blocking):', emailError.message);
        }

        logger.info(`Item marked for donation: ${item.name} (${item.availableQuantity} units) by ${restaurant.name}`);

        res.status(200).json({
            success: true,
            message: `${item.name} marked for NGO donation. ${item.availableQuantity} portions available at $0.`,
            item: {
                id: item._id,
                name: item.name,
                availableQuantity: item.availableQuantity,
                isDonationEligible: true
            }
        });

    } catch (error) {
        logger.error('Mark for donation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Restaurant un-marks an item from donation
 * @route   PUT /api/restaurant/menu/:id/undonate
 * @access  Private (Restaurant)
 */
exports.unmarkDonation = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'No restaurant associated' });
        }

        const item = await MenuItem.findOne({ _id: req.params.id, restaurantId: restaurant._id });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        item.isDonationEligible = false;
        await item.save();

        res.status(200).json({
            success: true,
            message: `${item.name} removed from donation pool.`,
            item: { id: item._id, name: item.name, isDonationEligible: false }
        });
    } catch (error) {
        logger.error('Unmark donation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get AI status / health check
 * @route   GET /api/ai/status
 * @access  Public
 */
exports.getAIStatus = async (req, res) => {
    res.status(200).json({
        success: true,
        aiConfigured: geminiService.isConfigured(),
        model: geminiService.isConfigured() ? 'gemini-1.5-flash' : 'fallback-deterministic',
        capabilities: [
            'rescue-strategy',
            'meal-plan',
            'donation-alerts',
            'stitch-insights',
            'sponsor-meal'
        ]
    });
};

/**
 * @desc    Stitch AI Insights - Predictive Surplus, Dynamic Pricing, Recipe Suggestions
 * @route   GET /api/ai/stitch-insights
 * @access  Public
 */
exports.getStitchInsights = async (req, res) => {
    try {
        const availableItems = await MenuItem.find({
            isAvailable: true,
            availableQuantity: { $gt: 0 }
        }).populate('restaurantId', 'name address').limit(20).lean();

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentOrders = await Order.find({
            createdAt: { $gte: sevenDaysAgo },
            orderStatus: { $in: ['completed', 'confirmed', 'preparing', 'ready'] }
        }).lean();

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayPatterns = {};
        days.forEach(d => { dayPatterns[d] = { orders: 0, totalItems: 0, totalRevenue: 0 }; });
        recentOrders.forEach(order => {
            const day = days[new Date(order.createdAt).getDay()];
            dayPatterns[day].orders += 1;
            dayPatterns[day].totalItems += (order.items?.length || 0);
            dayPatterns[day].totalRevenue += (order.totalAmount || 0);
        });
        const today = days[new Date().getDay()];
        const todayPattern = dayPatterns[today];

        const predictiveSurplus = availableItems.slice(0, 5).map(item => {
            const hoursLeft = item.expiryTime ? Math.max(0, (new Date(item.expiryTime) - Date.now()) / 3600000) : 6;
            const riskLevel = hoursLeft < 2 ? 'critical' : hoursLeft < 4 ? 'high' : 'moderate';
            return {
                itemId: item._id, name: item.name,
                restaurant: item.restaurantId?.name || 'Unknown',
                currentQuantity: item.availableQuantity,
                predictedLeftover: Math.ceil(item.availableQuantity * (hoursLeft < 3 ? 0.7 : 0.4)),
                hoursUntilExpiry: Math.round(hoursLeft * 10) / 10,
                riskLevel,
                recommendation: riskLevel === 'critical' ? 'URGENT: Drop price 60% or donate now' : riskLevel === 'high' ? 'Reduce price by 40%' : 'Monitor for 2 hours'
            };
        });

        const dynamicPricing = availableItems.slice(0, 5).map(item => {
            const hoursLeft = item.expiryTime ? Math.max(0, (new Date(item.expiryTime) - Date.now()) / 3600000) : 6;
            let m = hoursLeft < 1 ? 0.3 : hoursLeft < 2 ? 0.4 : hoursLeft < 3 ? 0.55 : hoursLeft < 5 ? 0.7 : 0.85;
            return {
                itemId: item._id, name: item.name,
                originalPrice: item.originalPrice, currentPrice: item.discountedPrice,
                suggestedPrice: Math.max(1, Math.round(item.originalPrice * m * 100) / 100),
                suggestedDiscount: Math.round((1 - m) * 100),
                hoursLeft: Math.round(hoursLeft * 10) / 10,
                reasoning: hoursLeft < 2 ? 'Expiry imminent — aggressive pricing' : `${Math.round(hoursLeft)}h remaining`
            };
        });

        let recipeSuggestions = [
            { name: 'Community Surplus Bowl', description: 'Hearty bowl from today\'s surplus', itemsUsed: availableItems.slice(0, 3).map(i => i.name), servings: 10, prepTimeMinutes: 25 },
            { name: 'Rescue Wrap Platter', description: 'Fresh wraps for community kitchens', itemsUsed: availableItems.slice(0, 2).map(i => i.name), servings: 15, prepTimeMinutes: 15 },
            { name: 'Zero-Waste Snack Box', description: 'Individual snack boxes for shelters', itemsUsed: availableItems.slice(0, 4).map(i => i.name), servings: 20, prepTimeMinutes: 10 }
        ];

        if (geminiService.isConfigured() && availableItems.length > 0) {
            try {
                const prompt = `Given surplus: ${availableItems.map(i => i.name).join(', ')}. Suggest 3 recipes as JSON array: [{name, description, itemsUsed:[], servings, prepTimeMinutes}]. JSON only.`;
                const aiResp = await geminiService.generateContent(prompt);
                const cleaned = aiResp.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                recipeSuggestions = JSON.parse(cleaned);
            } catch (e) { logger.warn('AI recipe fallback used'); }
        }

        res.status(200).json({
            success: true,
            data: {
                timestamp: new Date().toISOString(),
                todayPattern: { day: today, expectedOrders: todayPattern.orders, trend: todayPattern.orders > 3 ? 'high' : todayPattern.orders > 1 ? 'moderate' : 'low' },
                predictiveSurplus, dynamicPricing, recipeSuggestions,
                networkStats: { totalActiveItems: availableItems.length, totalOrdersThisWeek: recentOrders.length, busiestDay: Object.entries(dayPatterns).sort((a, b) => b[1].orders - a[1].orders)[0]?.[0] || today }
            }
        });
    } catch (error) {
        logger.error('Stitch insights error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate Stitch insights' });
    }
};

/**
 * @desc    Sponsor a meal (Ghost Meal / Feed the Grid)
 * @route   POST /api/ai/sponsor-meal
 * @access  Private
 */
exports.sponsorMeal = async (req, res) => {
    try {
        const { itemId, quantity = 1, message } = req.body;
        const item = await MenuItem.findById(itemId).populate('restaurantId');
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        if (item.availableQuantity < quantity) return res.status(400).json({ success: false, message: 'Insufficient quantity' });

        const order = new Order({
            customerId: req.user._id, restaurantId: item.restaurantId._id,
            items: [{ itemId: item._id, name: item.name, quantity, unitPrice: item.discountedPrice, itemTotal: item.discountedPrice * quantity, carbonScore: item.carbonScore || 0 }],
            subtotal: item.discountedPrice * quantity, totalAmount: item.discountedPrice * quantity,
            paymentMethod: 'card', paymentStatus: 'completed', orderStatus: 'confirmed',
            specialInstructions: `🎁 SPONSORED — "${message || 'From a kind stranger'}" — NGO Pickup`,
            totalCarbonSaved: (item.carbonScore || 0) * quantity
        });
        order.generateQRData();
        await order.save();

        item.availableQuantity -= quantity;
        if (item.availableQuantity <= 0) item.isAvailable = false;
        await item.save();

        res.status(201).json({
            success: true, message: 'Meal sponsored successfully!',
            data: { orderId: order._id, orderNumber: order.orderNumber, itemName: item.name, restaurant: item.restaurantId.name, amount: order.totalAmount, carbonSaved: order.totalCarbonSaved, sponsorMessage: message || 'From a kind stranger' }
        });
    } catch (error) {
        logger.error('Sponsor meal error:', error);
        res.status(500).json({ success: false, message: 'Failed to sponsor meal' });
    }
};

/**
 * @desc    Get all sponsored meals waiting for NGO pickup
 * @route   GET /api/ai/sponsored-orders
 * @access  Private (NGO)
 */
exports.getSponsoredOrders = async (req, res) => {
    try {
        // Find orders with specialInstructions containing SPONSORED and no assignedNGO
        const orders = await Order.find({
            specialInstructions: { $regex: /SPONSORED/i },
            assignedNGO: { $exists: false },
            orderStatus: { $in: ['confirmed', 'preparing', 'ready'] }
        }).populate('restaurantId', 'name address');

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        logger.error('Get sponsored orders error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sponsored grid orders' });
    }
};

/**
 * @desc    NGO claims a sponsored meal for dispatch
 * @route   POST /api/ai/dispatch-order/:id
 * @access  Private (NGO)
 */
exports.dispatchOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order logic node not found' });

        if (order.assignedNGO) {
            return res.status(400).json({ success: false, message: 'Order already claimed by another NGO partner' });
        }

        order.assignedNGO = req.user._id;
        order.dispatchStatus = 'dispatching';
        order.statusHistory.push({
            status: 'dispatching',
            timestamp: new Date(),
            note: `NGO Partner "${req.user.fullName}" has initialized dispatch protocol.`
        });

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Dispatch sequence initialized',
            data: order
        });
    } catch (error) {
        logger.error('Dispatch order error:', error);
        res.status(500).json({ success: false, message: 'Failed to initialize dispatch protocol' });
    }
};

/**
 * @desc    Stitch Vision - Analyze food image to identify it
 * @route   POST /api/ai/analyze-image
 * @access  Private (Restaurant)
 */
exports.analyzeImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        const analysis = await geminiService.analyzeImage(req.file.buffer, req.file.mimetype);

        res.status(200).json({
            success: true,
            data: analysis
        });
    } catch (error) {
        logger.error('Stitch Vision controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Stitch Vision node failed to process visual data'
        });
    }
};

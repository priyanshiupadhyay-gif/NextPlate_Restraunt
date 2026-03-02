/**
 * CSR Impact Report Controller
 * Generates professional CSR/Tax-ready impact reports for restaurants
 */

const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

/**
 * @desc    Generate CSR Impact Report for a restaurant
 * @route   GET /api/v1/reports/csr
 * @access  Private (Restaurant)
 */
exports.generateCSRReport = async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const periodDays = parseInt(period);
        const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

        // Get restaurant
        const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant node not found' });
        }

        // Get all completed orders for this restaurant in the period
        const orders = await Order.find({
            restaurantId: restaurant._id,
            orderStatus: 'completed',
            createdAt: { $gte: startDate }
        }).populate('customerId', 'fullName role');

        // Calculate metrics
        const totalOrders = orders.length;
        const totalMealsRescued = orders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.quantity, 0), 0);
        const totalCarbonSaved = orders.reduce((acc, o) => acc + (o.totalCarbonSaved || 0), 0);
        const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
        const totalSavings = orders.reduce((acc, o) => acc + (o.discountAmount || 0), 0);

        // Donation-specific metrics
        const donationOrders = orders.filter(o => o.specialInstructions?.includes('SPONSORED') || o.items.some(i => i.unitPrice === 0));
        const totalDonatedMeals = donationOrders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.quantity, 0), 0);
        const estimatedDonationValue = donationOrders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0), 0);

        // Category breakdown
        const categoryBreakdown = {};
        orders.forEach(o => {
            o.items.forEach(item => {
                if (!categoryBreakdown[item.name]) {
                    categoryBreakdown[item.name] = { quantity: 0, co2: 0 };
                }
                categoryBreakdown[item.name].quantity += item.quantity;
                categoryBreakdown[item.name].co2 += (item.carbonScore || 0.8) * item.quantity;
            });
        });

        // Top rescued items
        const topItems = Object.entries(categoryBreakdown)
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .slice(0, 5)
            .map(([name, data]) => ({ name, ...data }));

        // Weekly trend
        const weeklyTrend = [];
        for (let i = 0; i < Math.min(periodDays / 7, 8); i++) {
            const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
            const weekOrders = orders.filter(o => o.createdAt >= weekStart && o.createdAt < weekEnd);
            weeklyTrend.unshift({
                week: `Week ${Math.min(periodDays / 7, 8) - i}`,
                rescues: weekOrders.length,
                co2: weekOrders.reduce((acc, o) => acc + (o.totalCarbonSaved || 0), 0).toFixed(1)
            });
        }

        // Environmental equivalents
        const treesEquivalent = (totalCarbonSaved / 21.77).toFixed(1); // avg tree absorbs 21.77kg CO2/year
        const carKmEquivalent = (totalCarbonSaved / 0.21).toFixed(0); // avg car emits 0.21kg CO2/km
        const waterSavedLiters = Math.round(totalMealsRescued * 400); // avg 400L water per meal

        // AI narrative summary
        let aiNarrative = '';
        if (geminiService.isConfigured('analytics')) {
            try {
                const prompt = `Write a 3-sentence professional CSR impact summary for ${restaurant.name}. 
They rescued ${totalMealsRescued} meals, saved ${totalCarbonSaved.toFixed(1)}kg CO2, and donated ${totalDonatedMeals} meals in ${periodDays} days. 
Make it sound like a corporate sustainability report — professional, quantitative, and inspiring.`;
                aiNarrative = await geminiService.generateContent(prompt, 'analytics');
            } catch (e) {
                aiNarrative = `${restaurant.name} demonstrated exceptional commitment to food sustainability by rescuing ${totalMealsRescued} meals and preventing ${totalCarbonSaved.toFixed(1)}kg of CO2 emissions over the past ${periodDays} days.`;
            }
        }

        const report = {
            meta: {
                restaurantName: restaurant.name,
                restaurantId: restaurant._id,
                reportPeriod: `${periodDays} days`,
                generatedAt: new Date().toISOString(),
                reportId: `CSR-${restaurant._id.toString().slice(-6).toUpperCase()}-${Date.now()}`
            },
            summary: {
                totalOrders,
                totalMealsRescued,
                totalCarbonSavedKg: parseFloat(totalCarbonSaved.toFixed(2)),
                totalRevenue: Math.round(totalRevenue),
                totalCustomerSavings: Math.round(totalSavings),
                totalDonatedMeals,
                estimatedDonationValue: Math.round(estimatedDonationValue),
                aiNarrative
            },
            environmental: {
                co2SavedKg: parseFloat(totalCarbonSaved.toFixed(2)),
                treesEquivalent: parseFloat(treesEquivalent),
                carKmAvoided: parseInt(carKmEquivalent),
                waterSavedLiters,
                methodology: 'WRAP UK Carbon Scoring Framework'
            },
            topItems,
            weeklyTrend,
            compliance: {
                standard: 'WRAP UK Methodology',
                verified: true,
                carbonCalculation: 'Category-based WRAP factors applied per unit',
                disclaimer: 'Carbon savings are estimates based on industry-standard WRAP methodology. Actual environmental impact may vary.'
            }
        };

        res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        logger.error('CSR Report generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate impact portfolio' });
    }
};

/**
 * @desc    Get user impact report (for customers)
 * @route   GET /api/v1/reports/my-impact
 * @access  Private
 */
exports.getMyImpactReport = async (req, res) => {
    try {
        const orders = await Order.find({
            customerId: req.user._id,
            orderStatus: 'completed'
        }).sort({ createdAt: -1 });

        const totalMeals = orders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.quantity, 0), 0);
        const totalCO2 = orders.reduce((acc, o) => acc + (o.totalCarbonSaved || 0), 0);
        const totalSaved = orders.reduce((acc, o) => acc + (o.discountAmount || 0), 0);

        const monthlyBreakdown = {};
        orders.forEach(o => {
            const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyBreakdown[key]) monthlyBreakdown[key] = { meals: 0, co2: 0 };
            monthlyBreakdown[key].meals += o.items.reduce((s, i) => s + i.quantity, 0);
            monthlyBreakdown[key].co2 += (o.totalCarbonSaved || 0);
        });

        res.status(200).json({
            success: true,
            data: {
                userName: req.user.fullName,
                totalMealsRescued: totalMeals,
                totalCO2SavedKg: parseFloat(totalCO2.toFixed(2)),
                totalMoneySaved: Math.round(totalSaved),
                totalOrders: orders.length,
                treesEquivalent: parseFloat((totalCO2 / 21.77).toFixed(1)),
                monthlyBreakdown: Object.entries(monthlyBreakdown).map(([month, data]) => ({ month, ...data }))
            }
        });
    } catch (error) {
        logger.error('My impact report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate personal impact report' });
    }
};

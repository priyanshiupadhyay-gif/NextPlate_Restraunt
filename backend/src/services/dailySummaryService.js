/**
 * Daily Impact Summary Service
 * Uses Gemini to auto-generate an insightful daily impact summary
 * for the platform. Runs as a background cron job and stores summaries.
 */

const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Notification = require('../models/Notification');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const geminiService = require('../services/geminiService');

// In-memory cache for the latest summary (refreshed daily)
let latestSummary = null;
let lastGeneratedAt = null;

/**
 * Gather today's platform-wide metrics
 */
const gatherDailyMetrics = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Today's orders
    const todayOrders = await Order.find({
        createdAt: { $gte: todayStart },
        orderStatus: { $in: ['completed', 'ready', 'preparing', 'confirmed', 'placed'] }
    }).populate('restaurantId', 'name');

    // Yesterday's orders (for comparison)
    const yesterdayOrders = await Order.countDocuments({
        createdAt: { $gte: yesterdayStart, $lt: todayStart },
        orderStatus: { $in: ['completed', 'ready', 'preparing', 'confirmed', 'placed'] }
    });

    // Today's stats
    const todayMeals = todayOrders.reduce((acc, o) =>
        acc + o.items.reduce((s, i) => s + i.quantity, 0), 0);

    const todayCO2 = todayOrders.reduce((acc, o) => acc + (o.totalCarbonSaved || 0), 0);
    const todayRevenue = todayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    // Top restaurant contributors today
    const restaurantCounts = {};
    todayOrders.forEach(o => {
        const name = o.restaurantId?.name || 'Unknown';
        restaurantCounts[name] = (restaurantCounts[name] || 0) + 1;
    });
    const topRestaurants = Object.entries(restaurantCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, orders: count }));

    // Active users today
    const activeUsers = await User.countDocuments({
        lastLogin: { $gte: todayStart }
    });

    // Items currently available
    const availableSurplus = await MenuItem.countDocuments({
        isAvailable: true,
        isApproved: true,
        availableQuantity: { $gt: 0 }
    });

    // Total platform stats
    const totalUsers = await User.countDocuments({});
    const totalRestaurants = await Restaurant.countDocuments({ isVerified: true });

    // Cancelled orders (to analyze waste)
    const cancelledToday = await Order.countDocuments({
        createdAt: { $gte: todayStart },
        orderStatus: 'cancelled'
    });

    return {
        date: todayStart.toISOString().slice(0, 10),
        todayOrders: todayOrders.length,
        yesterdayOrders,
        todayMeals,
        todayCO2: parseFloat(todayCO2.toFixed(2)),
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        topRestaurants,
        activeUsers,
        availableSurplus,
        totalUsers,
        totalRestaurants,
        cancelledToday,
        orderGrowth: yesterdayOrders > 0
            ? parseFloat(((todayOrders.length - yesterdayOrders) / yesterdayOrders * 100).toFixed(1))
            : 0
    };
};

/**
 * Generate AI summary using Gemini
 */
const generateAISummary = async (metrics) => {
    if (!geminiService.isConfigured('analytics')) {
        // Fallback without AI
        return {
            headline: `${metrics.todayMeals} meals rescued today!`,
            summary: `Today ${metrics.todayOrders} orders rescued ${metrics.todayMeals} meals, saving ${metrics.todayCO2}kg CO₂. ${metrics.topRestaurants.length > 0 ? `Top rescuer: ${metrics.topRestaurants[0].name}.` : ''} ${metrics.availableSurplus} items still available for rescue.`,
            highlights: [
                `🍽️ ${metrics.todayMeals} meals saved from waste`,
                `🌿 ${metrics.todayCO2}kg CO₂ prevented`,
                `📈 ${metrics.orderGrowth > 0 ? '+' : ''}${metrics.orderGrowth}% vs yesterday`,
                `👥 ${metrics.activeUsers} active rescuers today`
            ],
            mood: metrics.todayOrders > metrics.yesterdayOrders ? 'growing' : 'steady',
            generatedBy: 'fallback'
        };
    }

    try {
        const prompt = `You are Stitch, the AI mascot of NextPlate — a food rescue platform. Generate a brief, inspiring daily impact summary based on today's data.

TODAY'S METRICS:
- Date: ${metrics.date}
- Orders today: ${metrics.todayOrders} (yesterday: ${metrics.yesterdayOrders}, growth: ${metrics.orderGrowth}%)
- Meals rescued: ${metrics.todayMeals}
- CO₂ saved: ${metrics.todayCO2}kg
- Revenue: $${metrics.todayRevenue}
- Active users: ${metrics.activeUsers}
- Top restaurants: ${metrics.topRestaurants.map(r => `${r.name} (${r.orders} orders)`).join(', ') || 'None yet'}
- Available surplus items: ${metrics.availableSurplus}
- Platform: ${metrics.totalUsers} users, ${metrics.totalRestaurants} restaurants
- Cancelled: ${metrics.cancelledToday}

INSTRUCTIONS:
- Write as Stitch (friendly, warm, data-driven)
- Be specific with numbers
- Use food/nature metaphors
- Keep it short and punchy (under 150 words total)
- If today had zero orders, be encouraging about tomorrow

Return ONLY valid JSON:
{
  "headline": "Punchy 5-8 word headline with emoji",
  "summary": "2-3 sentence inspiring summary of the day (mention specific numbers)",
  "highlights": ["4 short bullet points with emoji prefix, each under 10 words"],
  "mood": "one of: thriving, growing, steady, quiet, launching",
  "stitchQuote": "A short motivational quote from Stitch (under 15 words)"
}`;

        const result = await geminiService.generateContent(prompt, 'analytics');
        const text = result.trim()
            .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(text);
        parsed.generatedBy = 'gemini';
        return parsed;

    } catch (error) {
        logger.error('Gemini daily summary error:', error.message);
        // Fallback
        return {
            headline: `🌱 ${metrics.todayMeals} Meals Rescued Today`,
            summary: `Today's network processed ${metrics.todayOrders} rescue operations, saving ${metrics.todayMeals} meals and ${metrics.todayCO2}kg of CO₂. The grid is ${metrics.orderGrowth >= 0 ? 'growing' : 'stabilizing'}.`,
            highlights: [
                `🍽️ ${metrics.todayMeals} meals saved`,
                `🌿 ${metrics.todayCO2}kg CO₂ prevented`,
                `📊 ${metrics.orderGrowth > 0 ? '+' : ''}${metrics.orderGrowth}% growth`,
                `🏪 ${metrics.totalRestaurants} active restaurants`
            ],
            mood: 'steady',
            stitchQuote: 'Every plate rescued is a seed of change. 🌱',
            generatedBy: 'fallback'
        };
    }
};

/**
 * Run the daily summary generation (called by cron)
 */
const generateDailySummary = async () => {
    try {
        logger.info('[DailySummary] Generating daily impact summary...');
        const metrics = await gatherDailyMetrics();
        const summary = await generateAISummary(metrics);

        latestSummary = {
            ...summary,
            metrics,
            generatedAt: new Date().toISOString()
        };
        lastGeneratedAt = new Date();

        logger.info(`[DailySummary] Generated: "${summary.headline}"`);

        // Send push notification to all users with FCM tokens
        try {
            const usersWithTokens = await User.find({ fcmToken: { $ne: null } }).select('fcmToken');
            const tokenCount = usersWithTokens.length;

            if (tokenCount > 0) {
                // Send to first 500 users (FCM batch limit)
                const tokens = usersWithTokens.slice(0, 500).map(u => u.fcmToken);
                for (const token of tokens) {
                    await notificationService.sendPushNotification(
                        token,
                        summary.headline,
                        summary.summary,
                        { type: 'daily_summary' }
                    );
                }
                logger.info(`[DailySummary] Push notification sent to ${Math.min(tokenCount, 500)} users`);
            }
        } catch (pushErr) {
            logger.warn('[DailySummary] Push notification batch failed:', pushErr.message);
        }

        return latestSummary;
    } catch (error) {
        logger.error('[DailySummary] Generation failed:', error);
        return null;
    }
};

/**
 * Get the latest summary (API endpoint handler)
 */
const getLatestSummary = async (req, res) => {
    try {
        // If no summary exists or it's older than 3 hours, regenerate
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        if (!latestSummary || !lastGeneratedAt || lastGeneratedAt < threeHoursAgo) {
            await generateDailySummary();
        }

        if (!latestSummary) {
            return res.status(200).json({
                success: true,
                summary: {
                    headline: '🌱 NextPlate is Starting Up',
                    summary: 'No impact data available yet. Start rescuing food to see your daily summary!',
                    highlights: ['🚀 Platform is live', '🍽️ Start rescuing today'],
                    mood: 'launching',
                    stitchQuote: 'The best time to rescue is now! 🌱',
                    generatedBy: 'default',
                    metrics: {},
                    generatedAt: new Date().toISOString()
                }
            });
        }

        res.status(200).json({
            success: true,
            summary: latestSummary
        });
    } catch (error) {
        logger.error('Get daily summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch daily summary' });
    }
};

/**
 * Get user-specific daily impact
 */
const getUserDailySummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const userOrders = await Order.find({
            customerId: userId,
            createdAt: { $gte: todayStart },
            orderStatus: { $nin: ['cancelled'] }
        });

        const mealsToday = userOrders.reduce((acc, o) =>
            acc + o.items.reduce((s, i) => s + i.quantity, 0), 0);
        const co2Today = userOrders.reduce((acc, o) => acc + (o.totalCarbonSaved || 0), 0);

        const user = await User.findById(userId);

        // Get global summary too
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        if (!latestSummary || !lastGeneratedAt || lastGeneratedAt < threeHoursAgo) {
            await generateDailySummary();
        }

        res.status(200).json({
            success: true,
            userImpact: {
                ordersToday: userOrders.length,
                mealsToday,
                co2Today: parseFloat(co2Today.toFixed(2)),
                lifetimeMeals: user?.totalMealsRescued || 0,
                lifetimeCO2: parseFloat((user?.totalCarbonSaved || 0).toFixed(2))
            },
            globalSummary: latestSummary
        });
    } catch (error) {
        logger.error('User daily summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user summary' });
    }
};

/**
 * Start the daily summary cron (called from server.js)
 */
const startDailySummaryCron = () => {
    // Generate on startup after 10 seconds
    setTimeout(generateDailySummary, 10000);

    // Then regenerate every 3 hours
    setInterval(generateDailySummary, 3 * 60 * 60 * 1000);

    logger.info('[DailySummary] Daily Impact Summary cron started (Interval: 3h)');
};

module.exports = {
    generateDailySummary,
    getLatestSummary,
    getUserDailySummary,
    startDailySummaryCron
};

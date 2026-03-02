/**
 * Echo Notification Service
 * Proactive AI-powered notifications for price drops on viewed items
 * Works with Adaptive Pricing to alert users about expiry-driven discounts
 */

const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const logger = require('../utils/logger');

// In-memory view tracking (production would use Redis)
const viewTracker = {};

/**
 * Track when a user views a menu item
 * Called from menu item detail views
 */
const trackView = (userId, itemId) => {
    if (!userId || !itemId) return;
    const key = userId.toString();
    if (!viewTracker[key]) viewTracker[key] = {};
    viewTracker[key][itemId.toString()] = {
        viewedAt: Date.now(),
        notified: false
    };

    // Keep only last 20 views per user
    const entries = Object.entries(viewTracker[key]);
    if (entries.length > 20) {
        const sorted = entries.sort((a, b) => b[1].viewedAt - a[1].viewedAt);
        viewTracker[key] = Object.fromEntries(sorted.slice(0, 20));
    }
};

/**
 * Check for price drops on viewed items and send Echo notifications
 * Called by the Adaptive Pricing Service after each price update cycle
 */
const checkEchoAlerts = async () => {
    try {
        const allUsers = Object.keys(viewTracker);
        if (allUsers.length === 0) return;

        for (const userId of allUsers) {
            const views = viewTracker[userId];
            const viewedItemIds = Object.keys(views).filter(id => !views[id].notified);

            if (viewedItemIds.length === 0) continue;

            // Find items that still exist, are available, and have been price-dropped
            const items = await MenuItem.find({
                _id: { $in: viewedItemIds },
                isAvailable: true,
                availableQuantity: { $gt: 0 },
                isAdaptivePricing: true
            }).select('name discountedPrice originalPrice discountPercentage expiryTime');

            for (const item of items) {
                // Only alert if discount is >= 50% (significant drop)
                if (!item.discountPercentage || item.discountPercentage < 50) continue;

                const timeLeft = item.expiryTime ? Math.round((item.expiryTime - Date.now()) / (1000 * 60)) : null;
                if (timeLeft !== null && timeLeft <= 0) continue; // expired

                // Mark as notified
                views[item._id.toString()].notified = true;

                // Build notification payload
                const notification = {
                    type: 'echo_price_drop',
                    userId,
                    title: '📡 Echo Alert: Price Drop Detected',
                    body: `${item.name} just dropped to $${item.discountedPrice} (${item.discountPercentage}% off)${timeLeft ? ` — ${timeLeft}m left to rescue!` : ''}`,
                    data: {
                        itemId: item._id,
                        itemName: item.name,
                        newPrice: item.discountedPrice,
                        discount: item.discountPercentage,
                        minutesLeft: timeLeft
                    }
                };

                // Emit via Socket.IO to the specific user
                if (global.io) {
                    global.io.emit(`echo:${userId}`, notification);
                    logger.info(`📡 Echo Alert sent to ${userId}: ${item.name} @ $${item.discountedPrice}`);
                }

                // Also try FCM push notification if user has token
                try {
                    const user = await User.findById(userId).select('fcmToken');
                    if (user?.fcmToken) {
                        const admin = require('firebase-admin');
                        if (admin.apps.length > 0) {
                            await admin.messaging().send({
                                token: user.fcmToken,
                                notification: {
                                    title: notification.title,
                                    body: notification.body
                                },
                                data: {
                                    itemId: item._id.toString(),
                                    type: 'echo_price_drop'
                                }
                            });
                        }
                    }
                } catch (fcmError) {
                    // FCM is best-effort, don't fail the whole loop
                    logger.debug('FCM Echo push failed:', fcmError.message);
                }
            }
        }
    } catch (error) {
        logger.error('Echo notification check error:', error);
    }
};

/**
 * Start the Echo service (runs alongside Adaptive Pricing)
 * Checks every 5 minutes for price drop opportunities
 */
const startEchoService = () => {
    setInterval(checkEchoAlerts, 5 * 60 * 1000); // Every 5 minutes
    logger.info('📡 Echo Notification Service initialized (5m cycle)');
};

module.exports = { trackView, checkEchoAlerts, startEchoService };

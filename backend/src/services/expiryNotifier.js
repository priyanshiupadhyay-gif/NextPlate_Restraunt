/**
 * expiryNotifier.js
 * Background service to monitor food items near expiration and notify stakeholders
 */

const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

/**
 * Checks for items expiring in the next 30-60 minutes and alerts NGOs
 */
const checkExpiringItems = async () => {
    try {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);

        // Find items expiring between 30 and 60 minutes from now that are still available
        const expiringItems = await MenuItem.find({
            expiryTime: { $gte: thirtyMinsFromNow, $lte: oneHourFromNow },
            isAvailable: true,
            availableQuantity: { $gt: 0 }
        }).populate('restaurantId');

        if (expiringItems.length === 0) return;

        logger.info(`[Cron] Found ${expiringItems.length} items expiring soon. Notifying NGOs...`);

        // Get all verified NGOs with FCM tokens
        const ngos = await User.find({
            role: 'ngo',
            isVerifiedNGO: true,
            fcmToken: { $ne: null }
        });

        for (const item of expiringItems) {
            const restaurant = item.restaurantId;

            // Broadcast to all NGOs (Simple version)
            // In production, we'd use geospatial query to only notify nearby NGOs
            for (const ngo of ngos) {
                await notificationService.sendPushNotification(
                    ngo.fcmToken,
                    '🚨 Emergency Rescue Needed!',
                    `${item.name} from ${restaurant.name} is expiring in less than an hour! Rescue it now to save ${item.carbonScore || 0.8}kg CO2.`,
                    {
                        type: 'new_surplus',
                        itemId: item._id.toString(),
                        restaurantId: restaurant._id.toString()
                    }
                );
            }

            // Also notify the restaurant owner as a reminder
            const owner = await User.findById(restaurant.ownerId);
            if (owner && owner.fcmToken) {
                await notificationService.sendPushNotification(
                    owner.fcmToken,
                    '⏰ Surplus Expiry Warning',
                    `Your listing "${item.name}" is expiring soon. Consider donating it if not sold!`,
                    { type: 'pickup_reminder', itemId: item._id.toString() }
                );
            }
        }
    } catch (error) {
        logger.error('[Cron] Expiry notification error:', error);
    }
};

/**
 * Start the cron service
 */
const startExpiryCron = () => {
    // Run Every 15 minutes
    setInterval(checkExpiringItems, 15 * 60 * 1000);
    logger.info('[Cron] Surplus Expiry Notifier service started (Interval: 15m)');

    // Initial run after a short delay
    setTimeout(checkExpiringItems, 5000);
};

module.exports = { startExpiryCron };

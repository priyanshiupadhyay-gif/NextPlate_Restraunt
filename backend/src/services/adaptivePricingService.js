const MenuItem = require('../models/MenuItem');
const logger = require('../utils/logger');

/**
 * Adaptive Pricing Service
 * Background job to dynamically lower prices as items approach expiry
 */

const startAdaptivePricingCron = () => {
    // Run every 15 minutes
    setInterval(async () => {
        try {
            const now = new Date();
            // Find items with adaptive pricing enabled
            const items = await MenuItem.find({
                isAdaptivePricing: true,
                isAvailable: true,
                availableQuantity: { $gt: 0 },
                expiryTime: { $exists: true, $gt: now }
            });

            if (items.length === 0) return;

            const updates = [];
            for (const item of items) {
                const timeLeftMinutes = (item.expiryTime - now) / (1000 * 60);

                // Pricing strategy:
                // > 4 hours: baseDiscountedPrice (e.g. 50% off)
                // 2-4 hours: 60% off original
                // 1-2 hours: 75% off original
                // < 1 hour: 90% off original (aggressive liquidation)

                let newPrice = item.discountedPrice;
                const base = item.baseDiscountedPrice || item.discountedPrice;

                if (timeLeftMinutes < 60) {
                    newPrice = Math.round(item.originalPrice * 0.1); // 90% off
                } else if (timeLeftMinutes < 120) {
                    newPrice = Math.round(item.originalPrice * 0.25); // 75% off
                } else if (timeLeftMinutes < 240) {
                    newPrice = Math.round(item.originalPrice * 0.4); // 60% off
                }

                // Only update if price actually changed (to avoid unnecessary saves/logs)
                if (newPrice !== item.discountedPrice) {
                    const oldPrice = item.discountedPrice;
                    item.discountedPrice = newPrice;
                    // Pre-save hook will handle discountPercentage calculation
                    await item.save();

                    logger.info(`📉 Adaptive Price Update: ${item.name} (${item._id}) | $${oldPrice} -> $${newPrice} | Expiring in ${Math.round(timeLeftMinutes)}m`);

                    // Trigger real-time event if Socket.IO is available
                    if (global.io) {
                        global.io.emit('price:update', {
                            itemId: item._id,
                            newPrice: item.discountedPrice,
                            discountPercentage: item.discountPercentage,
                            reason: 'Expiry approach'
                        });
                    }
                }
            }
        } catch (error) {
            logger.error('Adaptive Pricing Service error:', error);
        }
    }, 15 * 60 * 1000); // Every 15 minutes

    logger.info('📉 Adaptive Pricing Service initialized (15m cycle)');
};

module.exports = { startAdaptivePricingCron };

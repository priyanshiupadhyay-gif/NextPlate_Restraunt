/**
 * Notification Service
 * Handles push notifications (Firebase FCM) and WhatsApp messages
 */

const logger = require('../utils/logger');
const { getMessaging, isFirebaseConfigured } = require('../config/firebase');
const axios = require('axios');

// WhatsApp Business API configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// Check if WhatsApp is configured
const isWhatsAppConfigured = () => {
    return !!(WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN);
};

// ============================================
// FIREBASE PUSH NOTIFICATIONS
// ============================================

/**
 * Send push notification to a user via FCM
 * @param {string} fcmToken - Device FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 */
exports.sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!isFirebaseConfigured()) {
        logger.warn('Firebase not configured, skipping push notification');
        return { success: false, error: 'Firebase not configured' };
    }

    if (!fcmToken) {
        logger.warn('No FCM token provided');
        return { success: false, error: 'No FCM token' };
    }

    const messaging = getMessaging();
    if (!messaging) {
        return { success: false, error: 'Firebase messaging not available' };
    }

    try {
        const message = {
            token: fcmToken,
            notification: {
                title,
                body,
            },
            data: {
                ...Object.fromEntries(
                    Object.entries(data).map(([k, v]) => [k, String(v)])
                ),
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'next_plate_orders',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        const response = await messaging.send(message);
        logger.info(`Push notification sent: ${title} - ${response}`);
        return { success: true, messageId: response };
    } catch (error) {
        logger.error('Push notification error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send push notification to multiple devices
 */
exports.sendPushToMultiple = async (fcmTokens, title, body, data = {}) => {
    if (!isFirebaseConfigured() || fcmTokens.length === 0) {
        return { success: false, error: 'No tokens or Firebase not configured' };
    }

    const messaging = getMessaging();
    if (!messaging) {
        return { success: false, error: 'Firebase messaging not available' };
    }

    try {
        const message = {
            tokens: fcmTokens,
            notification: { title, body },
            data: Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
            ),
        };

        const response = await messaging.sendEachForMulticast(message);
        logger.info(`Sent ${response.successCount}/${fcmTokens.length} notifications`);
        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
        };
    } catch (error) {
        logger.error('Multicast push error:', error.message);
        return { success: false, error: error.message };
    }
};

// ============================================
// WHATSAPP BUSINESS API
// ============================================

/**
 * Send WhatsApp template message
 * @param {string} phoneNumber - Recipient phone (with country code, no +)
 * @param {string} templateName - Pre-approved template name
 * @param {string} languageCode - Template language (e.g., 'en')
 * @param {array} parameters - Template parameters
 */
exports.sendWhatsAppTemplate = async (phoneNumber, templateName, languageCode = 'en', parameters = []) => {
    if (!isWhatsAppConfigured()) {
        logger.warn('WhatsApp not configured, skipping message');
        return { success: false, error: 'WhatsApp not configured' };
    }

    try {
        const response = await axios.post(
            `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: phoneNumber.replace('+', ''),
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: languageCode },
                    components: parameters.length > 0 ? [
                        {
                            type: 'body',
                            parameters: parameters.map(p => ({ type: 'text', text: String(p) })),
                        },
                    ] : [],
                },
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        logger.info(`WhatsApp template sent to ${phoneNumber}: ${templateName}`);
        return { success: true, messageId: response.data.messages?.[0]?.id };
    } catch (error) {
        logger.error('WhatsApp error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.error?.message || error.message };
    }
};

/**
 * Send WhatsApp text message
 */
exports.sendWhatsAppText = async (phoneNumber, text) => {
    if (!isWhatsAppConfigured()) {
        return { success: false, error: 'WhatsApp not configured' };
    }

    try {
        const response = await axios.post(
            `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: phoneNumber.replace('+', ''),
                type: 'text',
                text: { body: text },
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return { success: true, messageId: response.data.messages?.[0]?.id };
    } catch (error) {
        return { success: false, error: error.response?.data?.error?.message || error.message };
    }
};

// ============================================
// ORDER NOTIFICATIONS
// ============================================

/**
 * Send notification for order events
 */
exports.sendOrderNotification = async (orderId, type) => {
    try {
        const Order = require('../models/Order');
        const Notification = require('../models/Notification');
        const User = require('../models/User');

        const order = await Order.findById(orderId)
            .populate('restaurantId', 'name')
            .populate('customerId', 'fullName phone fcmToken whatsappOptIn');

        if (!order) {
            throw new Error('Order not found');
        }

        const restaurantName = order.restaurantId.name;
        const user = order.customerId;

        // Create in-app notification
        if (Notification.createOrderNotification) {
            await Notification.createOrderNotification(
                user._id,
                orderId,
                type,
                restaurantName
            );
        }

        // Send push notification
        if (user.fcmToken) {
            await exports.sendPushNotification(
                user.fcmToken,
                getNotificationTitle(type),
                getNotificationBody(type, restaurantName),
                { orderId: orderId.toString(), type }
            );
        }

        // Send WhatsApp notification (if user opted in)
        if (user.whatsappOptIn && user.phone && isWhatsAppConfigured()) {
            const templateMap = {
                confirmed: 'order_confirmed',
                ready: 'order_ready',
                cancelled: 'order_cancelled',
            };

            if (templateMap[type]) {
                // Try template first
                const templateResult = await exports.sendWhatsAppTemplate(
                    user.phone,
                    templateMap[type],
                    'en',
                    [order.orderNumber, restaurantName]
                );

                // Fallback to text message if template fails
                if (!templateResult.success) {
                    logger.warn(`WhatsApp template failed for ${type}, falling back to text`);
                    await exports.sendWhatsAppText(
                        user.phone,
                        getNotificationBody(type, restaurantName)
                    );
                }
            } else if (['paid', 'preparing'].includes(type)) {
                // For types without a template, send a text message
                await exports.sendWhatsAppText(
                    user.phone,
                    getNotificationBody(type, restaurantName)
                );
            }
        }

        logger.info(`Order notification sent: ${order.orderNumber} - ${type}`);
        return { success: true };
    } catch (error) {
        logger.error('Order notification error:', error);
        throw error;
    }
};

/**
 * Send pickup reminder (15 min before window)
 */
exports.sendPickupReminder = async (orderId) => {
    try {
        const Order = require('../models/Order');
        const order = await Order.findById(orderId)
            .populate('restaurantId', 'name')
            .populate('customerId', 'fcmToken');

        if (!order || !order.customerId.fcmToken) return;

        return exports.sendPushNotification(
            order.customerId.fcmToken,
            'Pickup Reminder ⏰',
            `Your pickup window starts in 15 minutes at ${order.restaurantId.name}!`,
            { orderId: orderId.toString(), type: 'pickup_reminder' }
        );
    } catch (error) {
        logger.error('Pickup reminder error:', error);
    }
};

/**
 * Notify restaurant about new order
 */
exports.notifyRestaurantNewOrder = async (orderId) => {
    try {
        const Order = require('../models/Order');
        const Restaurant = require('../models/Restaurant');

        const order = await Order.findById(orderId);
        if (!order) return;

        const restaurant = await Restaurant.findById(order.restaurantId);
        if (!restaurant || !restaurant.ownerFcmToken) return;

        return exports.sendPushNotification(
            restaurant.ownerFcmToken,
            'New Order! 🔔',
            `Order #${order.orderNumber} - ${order.items?.length || 0} items`,
            { orderId: orderId.toString(), type: 'new_order' }
        );
    } catch (error) {
        logger.error('Restaurant notification error:', error);
    }
};

/**
 * Send promotional notification to multiple users
 */
exports.sendBulkNotification = async (userIds, title, body, data = {}) => {
    try {
        const User = require('../models/User');
        const Notification = require('../models/Notification');

        // Get FCM tokens
        const users = await User.find({ _id: { $in: userIds } }).select('fcmToken');
        const tokens = users.filter(u => u.fcmToken).map(u => u.fcmToken);

        // Create in-app notifications
        const notifications = userIds.map(userId => ({
            userId,
            type: 'promotion',
            title,
            body,
            data
        }));
        await Notification.insertMany(notifications);

        // Send push notifications
        if (tokens.length > 0) {
            await exports.sendPushToMultiple(tokens, title, body, data);
        }

        logger.info(`Bulk notification sent to ${userIds.length} users`);
        return { success: true, count: userIds.length };
    } catch (error) {
        logger.error('Bulk notification error:', error);
        throw error;
    }
};

// Config checks
exports.isFirebaseConfigured = isFirebaseConfigured;
exports.isWhatsAppConfigured = isWhatsAppConfigured;

// Helper functions
function getNotificationTitle(type) {
    const titles = {
        paid: 'Order Confirmed! 🎉',
        confirmed: 'Order Confirmed ✅',
        accepted: 'Order Accepted ✅',
        preparing: 'Being Prepared 👨‍🍳',
        ready: 'Ready for Pickup! 🏃',
        cancelled: 'Order Cancelled',
        refunded: 'Refund Processed 💰',
    };
    return titles[type] || 'Order Update';
}

function getNotificationBody(type, restaurantName) {
    const bodies = {
        paid: `Your order at ${restaurantName} has been placed successfully!`,
        confirmed: `Your order at ${restaurantName} has been confirmed!`,
        accepted: `${restaurantName} is preparing your order!`,
        preparing: `${restaurantName} is preparing your delicious food now.`,
        ready: `Your food is ready! Head to ${restaurantName} and show your QR code.`,
        cancelled: 'Your order has been cancelled. Refund will be processed shortly.',
        refunded: 'Your refund has been processed successfully.',
    };
    return bodies[type] || 'Your order status has been updated.';
}

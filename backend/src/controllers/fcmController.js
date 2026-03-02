const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * POST /api/fcm/token
 * Save or update the FCM push token for the authenticated user
 */
exports.saveFCMToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    try {
        await User.findByIdAndUpdate(req.user.id, { fcmToken: token });
        logger.info(`FCM token saved for user ${req.user.id}`);
        res.json({ success: true, message: 'Push notification token registered' });
    } catch (error) {
        logger.error('Save FCM token error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to save token' });
    }
};

/**
 * GET /api/fcm/notifications
 * Fetch recent in-app notifications for the authenticated user
 */
exports.getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const unreadCount = await Notification.countDocuments({
            userId: req.user.id,
            isRead: false
        });

        res.json({
            success: true,
            notifications,
            unreadCount,
            page: parseInt(page),
        });
    } catch (error) {
        logger.error('Get notifications error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

/**
 * PATCH /api/fcm/notifications/:id/read
 * Mark a single notification as read
 */
exports.markRead = async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true, readAt: new Date() }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

/**
 * PATCH /api/fcm/notifications/read-all
 * Mark all notifications as read for user
 */
exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true, readAt: new Date() }
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

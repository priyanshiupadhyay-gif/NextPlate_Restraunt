const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/notifications/status
 * @desc    Check notification service status (Firebase + WhatsApp)
 * @access  Private (admin)
 */
router.get('/status', protect, authorize('admin'), async (req, res) => {
    const firebaseOk = notificationService.isFirebaseConfigured();
    const whatsappOk = notificationService.isWhatsAppConfigured();

    res.json({
        success: true,
        services: {
            firebase: {
                configured: firebaseOk,
                description: firebaseOk
                    ? 'Firebase FCM is configured and ready'
                    : 'Firebase credentials missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)',
            },
            whatsapp: {
                configured: whatsappOk,
                description: whatsappOk
                    ? 'WhatsApp Business API is configured'
                    : 'WhatsApp credentials missing (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)',
            },
        },
    });
});

/**
 * @route   POST /api/notifications/test-whatsapp
 * @desc    Send a test WhatsApp message to verify credentials
 * @access  Private (admin)
 */
router.post('/test-whatsapp', protect, authorize('admin'), async (req, res) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            message: 'phoneNumber is required (with country code, e.g. 919876543210)',
        });
    }

    if (!notificationService.isWhatsAppConfigured()) {
        return res.status(503).json({
            success: false,
            message: 'WhatsApp is not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env',
        });
    }

    try {
        const result = await notificationService.sendWhatsAppText(
            phoneNumber,
            message || '✅ NextPlate WhatsApp integration is working! This is a test message.'
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Test WhatsApp message sent successfully',
                messageId: result.messageId,
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to send WhatsApp message',
                error: result.error,
            });
        }
    } catch (error) {
        logger.error('Test WhatsApp error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal error sending WhatsApp message',
            error: error.message,
        });
    }
});

/**
 * @route   POST /api/notifications/test-fcm
 * @desc    Send a test push notification to a device
 * @access  Private (admin)
 */
router.post('/test-fcm', protect, authorize('admin'), async (req, res) => {
    const { fcmToken, title, body } = req.body;

    if (!fcmToken) {
        return res.status(400).json({
            success: false,
            message: 'fcmToken is required',
        });
    }

    if (!notificationService.isFirebaseConfigured()) {
        return res.status(503).json({
            success: false,
            message: 'Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env',
        });
    }

    try {
        const result = await notificationService.sendPushNotification(
            fcmToken,
            title || '🔔 NextPlate Test',
            body || 'Push notifications are working!',
            { type: 'test' }
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Test push notification sent',
                messageId: result.messageId,
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to send push notification',
                error: result.error,
            });
        }
    } catch (error) {
        logger.error('Test FCM error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal error sending push notification',
            error: error.message,
        });
    }
});

module.exports = router;

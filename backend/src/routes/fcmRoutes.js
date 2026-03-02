const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { saveFCMToken, getNotifications, markRead, markAllRead } = require('../controllers/fcmController');

// POST /api/fcm/token — Save FCM push token for current user
router.post('/token', auth, saveFCMToken);

// GET /api/fcm/notifications — Get in-app notifications for user
router.get('/notifications', auth, getNotifications);

// PATCH /api/fcm/notifications/:id/read — Mark a notification as read
router.patch('/notifications/:id/read', auth, markRead);

// PATCH /api/fcm/notifications/read-all — Mark all as read
router.patch('/notifications/read-all', auth, markAllRead);

module.exports = router;

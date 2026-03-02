const express = require('express');
const {
    getById,
    checkAvailability,
    getCategories,
    searchItems,
    getFeatured
} = require('../controllers/menuController');
const { protect } = require('../middlewares/auth');
const { trackView } = require('../services/echoNotificationService');

const router = express.Router();

// Public routes
router.get('/categories', getCategories);
router.get('/search', searchItems);
router.get('/featured', getFeatured);
router.get('/:id', getById);
router.get('/:id/availability', checkAvailability);

// Echo view tracking (authenticated)
router.post('/:id/echo-track', protect, (req, res) => {
    trackView(req.user._id, req.params.id);
    res.json({ success: true, message: 'View registered' });
});

module.exports = router;

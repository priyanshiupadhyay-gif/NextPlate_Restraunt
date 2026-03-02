const express = require('express');
const { body } = require('express-validator');
const protect = require('../middlewares/auth');
const {
    getProfile,
    updateProfile,
    uploadProfileImage,
    deleteAccount,
    getAddresses,
    addAddress,
    getImpactStats,
    getNGOMetrics,
    getCertificates
} = require('../controllers/userController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/profile', getProfile);

router.put('/profile',
    body('fullName').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number'),
    updateProfile
);

router.put('/profile-image',
    body('imageUrl').notEmpty().isURL().withMessage('Valid image URL is required'),
    uploadProfileImage
);

router.delete('/account', deleteAccount);

// Impact stats
router.get('/impact', getImpactStats);
router.get('/certificates', getCertificates);

// Address routes
router.get('/addresses', getAddresses);

router.post('/addresses',
    body('street').notEmpty().withMessage('Street is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('zipCode').notEmpty().withMessage('Zip code is required'),
    addAddress
);

// FCM Token route for push notifications
router.post('/fcm-token',
    body('fcmToken').notEmpty().withMessage('FCM token is required'),
    async (req, res) => {
        try {
            const User = require('../models/User');
            const { fcmToken } = req.body;

            await User.findByIdAndUpdate(req.user._id, { fcmToken });

            res.json({ success: true, message: 'FCM token updated' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// NGO Verification & Metrics
router.get('/ngo-metrics', getNGOMetrics);
router.put('/ngo-verification', async (req, res) => {
    try {
        const User = require('../models/User');
        const { docUrl } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                ngoVerificationStatus: 'pending',
                ngoVerificationDocUrl: docUrl
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Verification request submitted successfully',
            status: user.ngoVerificationStatus,
            docUrl: user.ngoVerificationDocUrl
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ─── Reviews ────────────────────────────────────────────────
router.get('/reviews', async (req, res) => {
    try {
        const Review = require('../models/Review');
        const reviews = await Review.find()
            .populate('userId', 'fullName avatarUrl')
            .populate('orderId', 'orderNumber')
            .populate('restaurantId', 'name')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/reviews',
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').notEmpty().isLength({ max: 1000 }).withMessage('Comment is required (max 1000 chars)'),
    async (req, res) => {
        try {
            const Review = require('../models/Review');
            const { rating, comment, orderId, restaurantId } = req.body;

            const review = await Review.create({
                userId: req.user._id,
                rating,
                comment,
                orderId: orderId || null,
                restaurantId: restaurantId || null
            });

            const populated = await Review.findById(review._id)
                .populate('userId', 'fullName avatarUrl')
                .populate('orderId', 'orderNumber')
                .populate('restaurantId', 'name');

            res.status(201).json({ success: true, review: populated });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ success: false, message: 'You already reviewed this order' });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const protect = require('../middlewares/auth');
const {
    login,
    getOrders,
    updateOrderStatus,
    verifyQR,
    getMenu,
    addMenuItem,
    editMenuItem,
    deleteMenuItem,
    toggleAvailability,
    getStats
} = require('../controllers/restaurantDashController');

const router = express.Router();

// Public route
router.post('/login',
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    login
);

// Protected routes
router.use(protect);

// Orders
router.get('/orders', getOrders);
router.put('/orders/:id/status',
    body('status').notEmpty().withMessage('Status is required'),
    updateOrderStatus
);
router.post('/orders/:id/verify-qr',
    body('qrData').notEmpty().withMessage('QR data is required'),
    verifyQR
);

// Menu management
router.get('/menu', getMenu);
router.post('/menu',
    body('name').notEmpty().withMessage('Name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('originalPrice').isNumeric().withMessage('Original price is required'),
    body('discountedPrice').isNumeric().withMessage('Discounted price is required'),
    body('availableQuantity').isInt({ min: 0 }).withMessage('Quantity must be 0 or more'),
    addMenuItem
);
router.put('/menu/:id', editMenuItem);
router.delete('/menu/:id', deleteMenuItem);
router.put('/menu/:id/availability', toggleAvailability);

// Donation management
const { markForDonation, unmarkDonation } = require('../controllers/aiController');
router.put('/menu/:id/donate', markForDonation);
router.put('/menu/:id/undonate', unmarkDonation);

// Dashboard
router.get('/stats', getStats);

module.exports = router;

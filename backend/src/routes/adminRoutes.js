const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const {
    login,
    listRestaurants,
    onboardRestaurant,
    verifyRestaurant,
    getChangeRequests,
    reviewChangeRequest,
    getOrders,
    getAnalytics,
    getUsers,
    verifyNGO
} = require('../controllers/adminController');

const router = express.Router();

router.post('/login',
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    login
);

router.use(protect);
router.use(authorize('admin'));

router.get('/restaurants', listRestaurants);
router.post('/restaurants',
    body('ownerEmail').isEmail().withMessage('Owner email is required'),
    onboardRestaurant
);
router.put('/restaurants/:id/verify', verifyRestaurant);

router.put('/ngos/:id/verify', verifyNGO);

router.get('/change-requests', getChangeRequests);
router.put('/change-requests/:id',
    body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
    reviewChangeRequest
);

router.get('/orders', getOrders);

router.get('/analytics', getAnalytics);

router.get('/users', getUsers);

module.exports = router;

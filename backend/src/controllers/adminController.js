const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const ChangeRequest = require('../models/ChangeRequest');
const User = require('../models/User');
const logger = require('../utils/logger');
const { generateToken, generateRefreshToken } = require('../services/tokenService');

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, role: 'admin' }).select('+password');

        if (!user || !(await user.comparePassword(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    List all restaurants
// @route   GET /api/admin/restaurants
// @access  Private (Admin)
exports.listRestaurants = async (req, res) => {
    try {
        const { isVerified, isActive, page = 1, limit = 20 } = req.query;

        const query = {};
        if (isVerified !== undefined) query.isVerified = isVerified === 'true';
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const restaurants = await Restaurant.find(query)
            .populate('ownerId', 'fullName email phoneNumber')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Restaurant.countDocuments(query);

        res.status(200).json({
            success: true,
            count: restaurants.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            restaurants
        });
    } catch (error) {
        logger.error('List restaurants error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Onboard new restaurant
// @route   POST /api/admin/restaurants
// @access  Private (Admin)
exports.onboardRestaurant = async (req, res) => {
    try {
        const { ownerEmail, ownerName, ownerPhone, ownerPassword, ...restaurantData } = req.body;

        // Create owner account
        let owner = await User.findOne({ email: ownerEmail });

        if (!owner) {
            owner = await User.create({
                fullName: ownerName,
                email: ownerEmail,
                phoneNumber: ownerPhone,
                password: ownerPassword,
                role: 'restaurant',
                isEmailVerified: true
            });
        } else if (owner.role !== 'restaurant') {
            owner.role = 'restaurant';
            await owner.save();
        }

        // Create restaurant
        const restaurant = await Restaurant.create({
            ...restaurantData,
            ownerId: owner._id,
            isVerified: false
        });

        logger.info(`Restaurant onboarded: ${restaurant.name}`);

        res.status(201).json({
            success: true,
            message: 'Restaurant onboarded successfully',
            restaurant,
            owner: {
                id: owner._id,
                email: owner.email
            }
        });
    } catch (error) {
        logger.error('Onboard restaurant error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify restaurant
// @route   PUT /api/admin/restaurants/:id/verify
// @access  Private (Admin)
exports.verifyRestaurant = async (req, res) => {
    try {
        const { isVerified, notes } = req.body;

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            { isVerified },
            { new: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        logger.info(`Restaurant ${restaurant.name} verification: ${isVerified}`);

        res.status(200).json({
            success: true,
            message: isVerified ? 'Restaurant verified' : 'Restaurant unverified',
            restaurant
        });
    } catch (error) {
        logger.error('Verify restaurant error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get pending change requests
// @route   GET /api/admin/change-requests
// @access  Private (Admin)
exports.getChangeRequests = async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 20 } = req.query;

        const query = {};
        if (status !== 'all') query.status = status;

        const requests = await ChangeRequest.find(query)
            .populate('restaurantId', 'name')
            .populate('menuItemId', 'name')
            .populate('submittedBy', 'fullName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await ChangeRequest.countDocuments(query);

        res.status(200).json({
            success: true,
            count: requests.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            requests
        });
    } catch (error) {
        logger.error('Get change requests error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Review change request (approve/reject)
// @route   PUT /api/admin/change-requests/:id
// @access  Private (Admin)
exports.reviewChangeRequest = async (req, res) => {
    try {
        const { action, notes } = req.body;

        const request = await ChangeRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Change request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request already reviewed'
            });
        }

        if (action === 'approve') {
            await request.approve(req.user.id, notes);

            // If it's an add_item or edit_item request, approve the menu item
            if ((request.requestType === 'add_item' || request.requestType === 'edit_item') && request.menuItemId) {
                await MenuItem.findByIdAndUpdate(request.menuItemId, { isApproved: true });
            }
        } else {
            await request.reject(req.user.id, notes);

            // If it's an add_item request that was rejected, delete the menu item
            if (request.requestType === 'add_item' && request.menuItemId) {
                await MenuItem.findByIdAndDelete(request.menuItemId);
            }
            // If it's an edit_item request that was rejected, revert to previous data
            if (request.requestType === 'edit_item' && request.menuItemId && request.previousData) {
                const { _id, __v, createdAt, updatedAt, ...revertData } = request.previousData;
                await MenuItem.findByIdAndUpdate(request.menuItemId, { ...revertData, isApproved: true });
            }
        }

        logger.info(`Change request ${request._id} ${action}ed`);

        res.status(200).json({
            success: true,
            message: `Request ${action}ed successfully`,
            request
        });
    } catch (error) {
        logger.error('Review change request error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all platform orders
// @route   GET /api/admin/orders
// @access  Private (Admin)
exports.getOrders = async (req, res) => {
    try {
        const { status, restaurantId, date, page = 1, limit = 50 } = req.query;

        const query = {};
        if (status) query.orderStatus = status;
        if (restaurantId) query.restaurantId = restaurantId;

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: startDate, $lte: endDate };
        }

        const orders = await Order.find(query)
            .populate('customerId', 'fullName email')
            .populate('restaurantId', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            orders
        });
    } catch (error) {
        logger.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateQuery = {};
        if (startDate) dateQuery.$gte = new Date(startDate);
        if (endDate) dateQuery.$lte = new Date(endDate);

        const [
            totalUsers,
            totalRestaurants,
            verifiedRestaurants,
            totalOrders,
            completedOrders,
            revenue,
            recentOrders
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Restaurant.countDocuments(),
            Restaurant.countDocuments({ isVerified: true }),
            Order.countDocuments(dateQuery.createdAt ? { createdAt: dateQuery } : {}),
            Order.countDocuments({ orderStatus: 'completed', ...(dateQuery.createdAt ? { createdAt: dateQuery } : {}) }),
            Order.aggregate([
                { $match: { paymentStatus: 'completed', ...(dateQuery.createdAt ? { createdAt: dateQuery } : {}) } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Order.find()
                .populate('restaurantId', 'name')
                .sort({ createdAt: -1 })
                .limit(10)
                .select('orderNumber totalAmount orderStatus createdAt')
        ]);

        // Orders by status
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);

        // Top restaurants by orders
        const topRestaurants = await Order.aggregate([
            { $match: { orderStatus: 'completed' } },
            { $group: { _id: '$restaurantId', orderCount: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
            { $sort: { orderCount: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
            { $unwind: '$restaurant' },
            { $project: { name: '$restaurant.name', orderCount: 1, revenue: 1 } }
        ]);

        res.status(200).json({
            success: true,
            analytics: {
                overview: {
                    totalUsers,
                    totalRestaurants,
                    verifiedRestaurants,
                    totalOrders,
                    completedOrders,
                    totalRevenue: revenue[0]?.total || 0
                },
                ordersByStatus: ordersByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
                topRestaurants,
                recentOrders
            }
        });
    } catch (error) {
        logger.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
    try {
        const { role, page = 1, limit = 50 } = req.query;

        const query = {};
        if (role) query.role = role;

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-password');

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            users
        });
    } catch (error) {
        logger.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// @desc    Verify NGO
// @route   PUT /api/admin/ngos/:id/verify
// @access  Private (Admin)
exports.verifyNGO = async (req, res) => {
    try {
        const { isVerifiedNGO, ngoImpactScore, notes } = req.body;

        const user = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'ngo' },
            { isVerifiedNGO, ngoImpactScore },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'NGO user not found'
            });
        }

        logger.info(`NGO ${user.fullName} verification: ${isVerifiedNGO}`);

        res.status(200).json({
            success: true,
            message: isVerifiedNGO ? 'NGO verified for Root Access' : 'NGO unverified',
            user
        });
    } catch (error) {
        logger.error('Verify NGO error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

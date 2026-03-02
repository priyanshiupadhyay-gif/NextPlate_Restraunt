const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const ChangeRequest = require('../models/ChangeRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');
const { generateToken, generateRefreshToken } = require('../services/tokenService');
const notificationService = require('../services/notificationService');

// @desc    Restaurant owner login
// @route   POST /api/restaurant/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, role: 'restaurant' }).select('+password');

        if (!user || !(await user.comparePassword(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const restaurant = await Restaurant.findOne({ ownerId: user._id });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'No restaurant associated with this account. Please register your restaurant first.'
            });
        }

        // Block login if restaurant is not yet verified by admin
        if (!restaurant.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Your restaurant application is under review. You will be able to log in once an admin approves your restaurant.'
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
            },
            restaurant: {
                id: restaurant._id,
                name: restaurant.name,
                isVerified: restaurant.isVerified,
                isActive: restaurant.isActive
            }
        });
    } catch (error) {
        logger.error('Restaurant login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get restaurant orders
// @route   GET /api/restaurant/orders
// @access  Private (Restaurant)
exports.getOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, date } = req.query;

        const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
        if (!restaurant) {
            logger.warn(`Restaurant not found for user ID: ${req.user.id}`);
            return res.status(404).json({
                success: false,
                message: 'No restaurant associated with this account. Please contact admin.'
            });
        }

        const query = { restaurantId: restaurant._id };

        if (status) {
            query.orderStatus = status;
        }

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: startDate, $lte: endDate };
        }

        const orders = await Order.find(query)
            .populate('customerId', 'fullName phoneNumber')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        // Get counts by status
        const statusCounts = await Order.aggregate([
            { $match: { restaurantId: restaurant._id } },
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
            orders
        });
    } catch (error) {
        logger.error('Get restaurant orders error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update order status
// @route   PUT /api/restaurant/orders/:id/status
// @access  Private (Restaurant)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        const orderId = req.params.id;

        logger.info(`[StatusUpdate] Attempting update for Order ${orderId} to status: ${status}`);

        const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'No restaurant associated with this account' });
        }

        const order = await Order.findOne({ _id: orderId, restaurantId: restaurant._id });

        if (!order) {
            logger.warn(`[StatusUpdate] Order ${orderId} not found for restaurant ${restaurant._id}`);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const validTransitions = {
            'placed': ['confirmed', 'cancelled'],
            'confirmed': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['completed'],
            'completed': [],
            'cancelled': []
        };

        if (!validTransitions[order.orderStatus]?.includes(status)) {
            logger.warn(`[StatusUpdate] Invalid transition from ${order.orderStatus} to ${status} requested for Order ${orderId}`);
            return res.status(400).json({
                success: false,
                message: `Transition not allowed: ${order.orderStatus} ➔ ${status}`
            });
        }

        // If cancelling, restore item quantities
        if (status === 'cancelled') {
            logger.info(`[StatusUpdate] Restoring items for cancelled Order ${orderId}`);
            for (const item of order.items) {
                await MenuItem.findByIdAndUpdate(item.itemId, {
                    $inc: { availableQuantity: item.quantity },
                    isAvailable: true
                });
            }
        }

        await order.updateStatus(status, note);

        // Notify customer (Safe-wrapped to avoid blocking response on non-critical failures)
        try {
            await Notification.createOrderNotification(order.customerId, order._id, status, restaurant.name);
            await notificationService.sendOrderNotification(order._id, status);
        } catch (notifError) {
            logger.error(`[StatusUpdate] Non-critical notification failure: ${notifError.message}`);
        }

        // Emit real-time Socket.IO events for order tracking and live map
        try {
            if (global.io) {
                // Notify the customer tracking this specific order
                global.io.to(`order:${orderId}`).emit('order:status', {
                    orderId,
                    status,
                    orderNumber: order.orderNumber,
                    restaurantName: restaurant.name
                });

                // If order is ready, also broadcast to the live map
                if (status === 'ready' && order.items?.length > 0) {
                    global.io.emit('rescue:new', {
                        item: order.items[0].name,
                        from: restaurant.name,
                        city: restaurant.address?.city || 'Unknown',
                        co2: (order.totalCarbonSaved || 0).toFixed(1),
                        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    });
                }
            }
        } catch (socketErr) {
            logger.warn('[StatusUpdate] Socket emit error:', socketErr.message);
        }

        logger.info(`[StatusUpdate] Success: Order ${order.orderNumber} is now ${status}`);

        res.status(200).json({
            success: true,
            message: `Order marked as ${status}`,
            order: { id: order._id, orderNumber: order.orderNumber, orderStatus: order.orderStatus }
        });
    } catch (error) {
        logger.error(`[StatusUpdate] Critical failure updating order ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify pickup QR code
// @route   POST /api/restaurant/orders/:id/verify-qr
// @access  Private (Restaurant)
exports.verifyQR = async (req, res) => {
    try {
        const { qrData } = req.body;

        const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'No restaurant associated with this account'
            });
        }

        // Validate QR code
        if (!Order.validateQRCode(qrData)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid QR code'
            });
        }

        const parsedData = JSON.parse(qrData);
        const order = await Order.findOne({
            _id: parsedData.orderId,
            restaurantId: restaurant._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.qrVerified) {
            return res.status(400).json({
                success: false,
                message: 'QR code already verified'
            });
        }

        if (order.orderStatus !== 'ready') {
            return res.status(400).json({
                success: false,
                message: `Order must be in 'ready' status. Current: ${order.orderStatus}`
            });
        }

        order.qrVerified = true;
        order.qrVerifiedAt = new Date();
        order.orderStatus = 'completed';
        order.statusHistory.push({
            status: 'completed',
            note: 'Order picked up - QR verified'
        });
        await order.save();

        // Update impact metrics
        const mealsRescued = order.items.reduce((acc, item) => acc + item.quantity, 0);
        const carbonSaved = order.totalCarbonSaved || (mealsRescued * 0.8);

        // Update restaurant stats
        restaurant.totalOrders += 1;
        await restaurant.save();

        // Update Restaurant Owner (User impact)
        await User.findByIdAndUpdate(req.user.id, {
            $inc: {
                totalCarbonSaved: carbonSaved,
                totalMealsRescued: mealsRescued
            }
        });

        // Update Customer impact
        await User.findByIdAndUpdate(order.customerId, {
            $inc: {
                totalCarbonSaved: carbonSaved,
                totalMealsRescued: mealsRescued
            }
        });

        logger.info(`QR verified for order ${order.orderNumber}`);

        res.status(200).json({
            success: true,
            message: 'Pickup verified successfully',
            order: {
                id: order._id,
                orderNumber: order.orderNumber,
                customerName: order.customerId?.fullName,
                items: order.items,
                totalAmount: order.totalAmount
            }
        });
    } catch (error) {
        logger.error('Verify QR error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get restaurant's menu items
// @route   GET /api/restaurant/menu
// @access  Private (Restaurant)
exports.getMenu = async (req, res) => {
    try {
        const { category, isAvailable, page = 1, limit = 50 } = req.query;

        const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'No restaurant associated with this account'
            });
        }

        const query = { restaurantId: restaurant._id };

        if (category) query.category = category;
        if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

        const items = await MenuItem.find(query)
            .sort({ category: 1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await MenuItem.countDocuments(query);

        res.status(200).json({
            success: true,
            count: items.length,
            total,
            items
        });
    } catch (error) {
        logger.error('Get restaurant menu error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add menu item (auto-approved for verified restaurants, pending for unverified)
// @route   POST /api/restaurant/menu
// @access  Private (Restaurant)
exports.addMenuItem = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'No restaurant associated with this account'
            });
        }

        // Verified restaurants get auto-approval; unverified need admin approval
        const autoApprove = restaurant.isVerified === true;

        // Ensure ngoPrice is valid
        let ngoPrice = req.body.ngoPrice;
        if (req.body.listingType === 'user_only') {
            ngoPrice = 0;
        } else {
            ngoPrice = Math.max(0, parseFloat(ngoPrice) || 0);
        }

        const itemData = {
            ...req.body,
            restaurantId: restaurant._id,
            isApproved: autoApprove,
            ngoPrice: ngoPrice
        };

        const item = await MenuItem.create(itemData);

        // Create change request for audit trail
        await ChangeRequest.create({
            restaurantId: restaurant._id,
            menuItemId: item._id,
            requestType: 'add_item',
            requestData: itemData,
            submittedBy: req.user.id,
            status: autoApprove ? 'approved' : 'pending'
        });

        // Notify all admin users about the new listing
        try {
            const Notification = require('../models/Notification');
            const User = require('../models/User');
            const admins = await User.find({ role: 'admin' }).select('_id');

            const notifTitle = autoApprove
                ? `New Item Listed: ${item.name}`
                : `New Item Pending Approval: ${item.name}`;
            const notifBody = autoApprove
                ? `${restaurant.name} (verified) has listed "${item.name}" — auto-approved and now live.`
                : `${restaurant.name} (unverified) wants to list "${item.name}" — requires your approval.`;

            await Promise.all(admins.map(admin =>
                Notification.create({
                    userId: admin._id,
                    type: 'alert',
                    title: notifTitle,
                    body: notifBody,
                    data: { menuItemId: item._id, restaurantId: restaurant._id, autoApproved: autoApprove },
                    actionUrl: autoApprove ? '/admin/restaurants' : '/admin/approvals'
                })
            ));
        } catch (notifErr) {
            logger.warn('Admin notification failed (non-critical):', notifErr?.message);
        }

        logger.info(`Menu item added: ${item.name} (${autoApprove ? 'auto-approved - verified restaurant' : 'pending approval - unverified restaurant'})`);

        res.status(201).json({
            success: true,
            message: autoApprove
                ? 'Menu item added successfully and is now live!'
                : 'Menu item added and pending admin approval. You will be notified once approved.',
            item,
            autoApproved: autoApprove
        });
    } catch (error) {
        logger.error('Add menu item error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Edit menu item (pending admin approval)
// @route   PUT /api/restaurant/menu/:id
// @access  Private (Restaurant)
exports.editMenuItem = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'No restaurant associated with this account'
            });
        }

        const item = await MenuItem.findOne({
            _id: req.params.id,
            restaurantId: restaurant._id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        const previousData = item.toObject();
        Object.assign(item, req.body);
        item.isApproved = false; // Require admin re-approval after edit
        await item.save();

        // Create change request for admin review
        await ChangeRequest.create({
            restaurantId: restaurant._id,
            menuItemId: item._id,
            requestType: 'edit_item',
            requestData: req.body,
            previousData,
            submittedBy: req.user.id,
            status: 'pending' // Requires admin approval
        });

        logger.info(`Menu item edited (pending approval): ${item.name}`);

        res.status(200).json({
            success: true,
            message: 'Menu item updated and sent for admin approval',
            item
        });
    } catch (error) {
        logger.error('Edit menu item error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete menu item
// @route   DELETE /api/restaurant/menu/:id
// @access  Private (Restaurant)
exports.deleteMenuItem = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'No restaurant associated with this account'
            });
        }

        const item = await MenuItem.findOneAndDelete({
            _id: req.params.id,
            restaurantId: restaurant._id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        logger.info(`Menu item deleted: ${item.name}`);

        res.status(200).json({
            success: true,
            message: 'Menu item deleted'
        });
    } catch (error) {
        logger.error('Delete menu item error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Toggle item availability
// @route   PUT /api/restaurant/menu/:id/availability
// @access  Private (Restaurant)
exports.toggleAvailability = async (req, res) => {
    try {
        const { isAvailable, availableQuantity } = req.body;

        const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'No restaurant associated with this account'
            });
        }

        const item = await MenuItem.findOne({
            _id: req.params.id,
            restaurantId: restaurant._id
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        if (isAvailable !== undefined) item.isAvailable = isAvailable;
        if (availableQuantity !== undefined) item.availableQuantity = availableQuantity;

        await item.save();

        res.status(200).json({
            success: true,
            message: 'Availability updated',
            item: {
                id: item._id,
                name: item.name,
                isAvailable: item.isAvailable,
                availableQuantity: item.availableQuantity
            }
        });
    } catch (error) {
        logger.error('Toggle availability error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get restaurant dashboard stats
// @route   GET /api/restaurant/stats
// @access  Private (Restaurant)
exports.getStats = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

        if (!restaurant) {
            logger.warn(`Restaurant not found for user ID: ${req.user.id}`);
            return res.status(404).json({
                success: false,
                message: 'No restaurant associated with this account. Please contact admin.'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [todayOrders, totalRevenue, pendingOrders, menuItems] = await Promise.all([
            Order.countDocuments({
                restaurantId: restaurant._id,
                createdAt: { $gte: today }
            }),
            Order.aggregate([
                { $match: { restaurantId: restaurant._id, paymentStatus: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Order.countDocuments({
                restaurantId: restaurant._id,
                orderStatus: { $in: ['placed', 'confirmed', 'preparing'] }
            }),
            MenuItem.countDocuments({
                restaurantId: restaurant._id,
                isAvailable: true
            })
        ]);

        res.status(200).json({
            success: true,
            stats: {
                todayOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                pendingOrders,
                activeMenuItems: menuItems,
                rating: restaurant.rating,
                totalRatings: restaurant.totalRatings,
                totalCarbonSaved: req.user.totalCarbonSaved || 0,
                totalMealsRescued: req.user.totalMealsRescued || 0
            }
        });
    } catch (error) {
        logger.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

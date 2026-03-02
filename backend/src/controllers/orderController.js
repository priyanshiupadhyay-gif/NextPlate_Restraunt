const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const QRCode = require('qrcode');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.create = async (req, res) => {
    try {
        const { restaurantId, items, pickupTimeSlot, specialInstructions, paymentMethod } = req.body;

        // Validate restaurantId
        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid restaurant ID format'
            });
        }

        // Check if user is a verified NGO for $0 "Root Access" claims
        const isNGOClaim = req.user.role === 'ngo' && req.user.isVerifiedNGO;

        // Validate restaurant
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant || !restaurant.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant not found or inactive'
            });
        }

        // Validate and process items
        let subtotal = 0;
        let totalCarbonSaved = 0;
        const orderItems = [];

        for (const item of items) {
            if (!item.itemId) {
                return res.status(400).json({
                    success: false,
                    message: 'Item ID is required'
                });
            }

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(item.itemId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid item ID format'
                });
            }

            const menuItem = await MenuItem.findById(item.itemId);

            if (!menuItem) {
                return res.status(400).json({
                    success: false,
                    message: `Item not found: ${item.itemId}`
                });
            }

            if (!menuItem.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Item ${menuItem.name} is not available`
                });
            }

            // Check listing type - NGOs can only order ngo_only or both, users can only order user_only or both
            if (!isNGOClaim) {
                // Regular user - cannot order NGO-only items
                // Handle cases where listingType might be undefined/null (legacy items default to user_only)
                const itemListingType = menuItem.listingType || 'user_only';
                if (itemListingType === 'ngo_only') {
                    return res.status(400).json({
                        success: false,
                        message: `This item is exclusively for NGO partners`
                    });
                }
            }

            if (menuItem.availableQuantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient quantity for ${menuItem.name}`
                });
            }

            // NGOs get items at ngoPrice (or free), users get at discountedPrice
            let itemTotal;
            if (isNGOClaim) {
                itemTotal = (menuItem.ngoPrice || 0) * item.quantity;
            } else {
                itemTotal = (menuItem.discountedPrice || 0) * item.quantity;
            }

            if (!isNGOClaim && item.customizations?.addOns) {
                item.customizations.addOns.forEach(addon => {
                    itemTotal += addon.price * item.quantity;
                });
            }

            const itemCarbonTotal = (menuItem.carbonScore || 0) * item.quantity;
            totalCarbonSaved += itemCarbonTotal;

            orderItems.push({
                itemId: menuItem._id,
                name: menuItem.name,
                quantity: item.quantity,
                unitPrice: isNGOClaim ? (menuItem.ngoPrice || 0) : (menuItem.discountedPrice || 0),
                customizations: item.customizations || {},
                itemTotal,
                carbonScore: menuItem.carbonScore || 0
            });

            subtotal += itemTotal;

            // Decrement item quantity with error handling
            try {
                await menuItem.decrementQuantity(item.quantity);
            } catch (qtyError) {
                logger.error('Quantity decrement error:', qtyError);
                return res.status(400).json({
                    success: false,
                    message: `Failed to update quantity for ${menuItem.name}: ${qtyError.message}`
                });
            }
        }

        // Calculate tax - $0 for NGO claims
        const taxAmount = isNGOClaim ? 0 : (Math.round(subtotal * 0.05 * 100) / 100);
        const totalAmount = subtotal + taxAmount;

        // Create order
        const order = await Order.create({
            customerId: req.user.id,
            restaurantId,
            items: orderItems,
            subtotal,
            taxAmount,
            totalAmount,
            totalCarbonSaved,
            paymentStatus: isNGOClaim ? 'completed' : 'pending',
            paymentMethod: isNGOClaim ? 'cod' : (paymentMethod || 'card'), // 'cod' as placeholder for free claim
            pickupTimeSlot,
            specialInstructions: isNGOClaim ? `[NGO RESCUE] ${specialInstructions || ''}` : specialInstructions,
            statusHistory: [{
                status: 'placed',
                note: isNGOClaim ? 'NGO Rescue Claim - Root Access' : 'Order placed by customer'
            }]
        });

        // Generate QR code
        const qrData = order.generateQRData();
        const qrCodeImage = await QRCode.toDataURL(qrData);
        order.qrCode = qrCodeImage;
        await order.save();

        logger.info(`Order created: ${order.orderNumber}`);

        // Send push notification to customer
        try {
            await notificationService.sendOrderNotification(order._id, 'paid');
            // Notify restaurant about new order
            await notificationService.notifyRestaurantNewOrder(order._id);
        } catch (notifError) {
            logger.error('Notification error:', notifError);
        }

        // Emit real-time Socket.IO event for Live Map
        try {
            if (global.io && orderItems.length > 0) {
                const firstItem = orderItems[0];
                global.io.emit('rescue:new', {
                    item: firstItem.name,
                    from: restaurant.name,
                    city: restaurant.address?.city || 'Unknown',
                    co2: (totalCarbonSaved).toFixed(1),
                    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                });
            }
        } catch (socketError) {
            logger.warn('Socket emit error:', socketError.message);
        }


        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: {
                id: order._id,
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus,
                qrCode: order.qrCode
            }
        });
    } catch (error) {
        logger.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
exports.getAll = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const query = { customerId: req.user.id };
        if (status) {
            query.orderStatus = status;
        }

        const orders = await Order.find(query)
            .populate('restaurantId', 'name logo address.city')
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
        logger.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getById = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            customerId: req.user.id
        })
            .populate('restaurantId', 'name logo address contactPhone operatingHours')
            .populate('items.itemId', 'images');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        logger.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get order QR code
// @route   GET /api/orders/:id/qr
// @access  Private
exports.getQRCode = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            customerId: req.user.id
        }).select('orderNumber qrCode qrVerified orderStatus');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.qrVerified) {
            return res.status(400).json({
                success: false,
                message: 'QR code already used'
            });
        }

        res.status(200).json({
            success: true,
            orderNumber: order.orderNumber,
            qrCode: order.qrCode,
            orderStatus: order.orderStatus
        });
    } catch (error) {
        logger.error('Get QR code error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancel = async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await Order.findOne({
            _id: req.params.id,
            customerId: req.user.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Can only cancel if not yet preparing
        const cancellableStatuses = ['placed', 'confirmed'];
        if (!cancellableStatuses.includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order in ${order.orderStatus} status`
            });
        }

        order.orderStatus = 'cancelled';
        order.cancellationReason = reason;
        order.cancelledBy = 'customer';
        order.cancelledAt = new Date();
        order.statusHistory.push({
            status: 'cancelled',
            note: reason || 'Cancelled by customer'
        });

        // Restore item quantities
        for (const item of order.items) {
            await MenuItem.findByIdAndUpdate(item.itemId, {
                $inc: { availableQuantity: item.quantity },
                isAvailable: true
            });
        }

        // TODO: Process refund if payment completed
        if (order.paymentStatus === 'completed') {
            order.refundAmount = order.totalAmount;
            // order.refundId = await processRefund(order.paymentId, order.totalAmount);
        }

        await order.save();

        logger.info(`Order cancelled: ${order.orderNumber}`);

        // Send cancellation notification
        try {
            await notificationService.sendOrderNotification(order._id, 'cancelled');
        } catch (notifError) {
            logger.error('Cancellation notification error:', notifError);
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order: {
                id: order._id,
                orderNumber: order.orderNumber,
                orderStatus: order.orderStatus,
                refundAmount: order.refundAmount
            }
        });
    } catch (error) {
        logger.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get order tracking info
// @route   GET /api/orders/:id/track
// @access  Private
exports.track = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            customerId: req.user.id
        })
            .select('orderNumber orderStatus statusHistory pickupTimeSlot')
            .populate('restaurantId', 'name address contactPhone');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            tracking: {
                orderNumber: order.orderNumber,
                currentStatus: order.orderStatus,
                history: order.statusHistory,
                pickupTimeSlot: order.pickupTimeSlot,
                restaurant: order.restaurantId
            }
        });
    } catch (error) {
        logger.error('Track order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

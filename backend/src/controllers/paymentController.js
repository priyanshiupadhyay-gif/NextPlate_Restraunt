const Order = require('../models/Order');
const logger = require('../utils/logger');

// Razorpay integration (conditionally loaded)
let razorpay = null;
try {
    const Razorpay = require('razorpay');
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        logger.info('Razorpay initialized successfully');
    } else {
        logger.warn('Razorpay credentials not found, payment gateway running in mock mode');
    }
} catch (err) {
    logger.warn('Razorpay package not installed, running in mock mode');
}

const crypto = require('crypto');

// @desc    Create payment order
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { orderId, amount } = req.body;

        const order = await Order.findOne({
            _id: orderId,
            customerId: req.user.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.paymentStatus === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Payment already completed'
            });
        }

        // If Razorpay is configured, use it
        if (razorpay) {
            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(order.totalAmount * 100), // paise
                currency: 'INR',
                receipt: order.orderNumber,
                notes: {
                    orderId: order._id.toString(),
                    customerEmail: req.user.email || '',
                },
            });

            logger.info(`Razorpay order created: ${razorpayOrder.id}`);

            return res.status(200).json({
                success: true,
                paymentOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    orderId: order._id,
                    key: process.env.RAZORPAY_KEY_ID,
                }
            });
        }

        // Fallback: mock payment for development
        const paymentOrder = {
            id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: order.totalAmount * 100,
            currency: 'INR',
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: 'created',
            createdAt: new Date()
        };

        logger.info(`Mock payment order created: ${paymentOrder.id}`);

        res.status(200).json({
            success: true,
            paymentOrder: {
                id: paymentOrder.id,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                orderId: order._id,
            }
        });
    } catch (error) {
        logger.error('Create payment order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
exports.verify = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        const order = await Order.findOne({
            _id: orderId,
            customerId: req.user.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        let isValid = false;

        // Verify Razorpay signature if configured
        if (razorpay && signature) {
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${orderId}|${paymentId}`)
                .digest('hex');

            isValid = expectedSignature === signature;
        } else {
            // Mock mode - assume valid
            isValid = true;
        }

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Update order
        order.paymentStatus = 'completed';
        order.paymentId = paymentId;
        order.orderStatus = 'confirmed';
        order.statusHistory.push({
            status: 'confirmed',
            note: 'Payment verified successfully'
        });
        await order.save();

        logger.info(`Payment verified: ${paymentId} for order ${order.orderNumber}`);

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            order: {
                id: order._id,
                orderNumber: order.orderNumber,
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus
            }
        });
    } catch (error) {
        logger.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Handle payment webhook
// @route   POST /api/payments/webhook
// @access  Public (with signature verification)
exports.handleWebhook = async (req, res) => {
    try {
        const { event, payload } = req.body;

        // Verify Razorpay webhook signature
        if (razorpay && process.env.RAZORPAY_WEBHOOK_SECRET) {
            const signature = req.headers['x-razorpay-signature'];
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (signature !== expectedSignature) {
                return res.status(400).json({ error: 'Invalid webhook signature' });
            }
        }

        logger.info(`Payment webhook received: ${event}`);

        switch (event) {
            case 'payment.captured':
                const capturedOrder = await Order.findOne({ paymentId: payload.payment.entity.id });
                if (capturedOrder) {
                    capturedOrder.paymentStatus = 'completed';
                    await capturedOrder.save();
                }
                break;

            case 'payment.failed':
                const failedOrder = await Order.findOne({ paymentId: payload.payment.entity.id });
                if (failedOrder) {
                    failedOrder.paymentStatus = 'failed';
                    failedOrder.statusHistory.push({
                        status: 'payment_failed',
                        note: payload.payment.entity.error_description || 'Payment failed'
                    });
                    await failedOrder.save();
                }
                break;

            case 'refund.created':
                // Handle refund initiated
                break;

            default:
                logger.info(`Unhandled webhook event: ${event}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('Webhook error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private (Admin)
exports.refund = async (req, res) => {
    try {
        const { orderId, amount, reason } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.paymentStatus !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'No completed payment to refund'
            });
        }

        const refundAmount = amount || order.totalAmount;
        let refundId;

        // If Razorpay is configured, process real refund
        if (razorpay && order.paymentId) {
            try {
                const refund = await razorpay.payments.refund(order.paymentId, {
                    amount: Math.round(refundAmount * 100),
                    notes: { reason: reason || 'Customer requested refund' }
                });
                refundId = refund.id;
            } catch (refundError) {
                logger.error('Razorpay refund error:', refundError);
                refundId = `rfnd_mock_${Date.now()}`;
            }
        } else {
            refundId = `rfnd_${Date.now()}`;
        }

        order.paymentStatus = 'refunded';
        order.refundAmount = refundAmount;
        order.refundId = refundId;
        order.statusHistory.push({
            status: 'refunded',
            note: reason || 'Refund processed'
        });
        await order.save();

        logger.info(`Refund processed: ${refundId} for order ${order.orderNumber}`);

        res.status(200).json({
            success: true,
            message: 'Refund initiated successfully',
            refund: {
                id: refundId,
                amount: refundAmount,
                status: 'processing'
            }
        });
    } catch (error) {
        logger.error('Refund error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const express = require('express');
const { body } = require('express-validator');
const protect = require('../middlewares/auth');
const {
    createOrder,
    verify,
    handleWebhook,
    refund
} = require('../controllers/paymentController');

const router = express.Router();

// Webhook endpoint (public, but signature verified)
router.post('/webhook', handleWebhook);

// Protected routes
router.use(protect);

router.post('/create-order',
    body('orderId').notEmpty().withMessage('Order ID is required'),
    createOrder
);

router.post('/verify',
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('paymentId').notEmpty().withMessage('Payment ID is required'),
    verify
);

router.post('/refund',
    body('orderId').notEmpty().withMessage('Order ID is required'),
    refund
);

module.exports = router;

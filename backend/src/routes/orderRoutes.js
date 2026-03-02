const express = require('express');
const { body } = require('express-validator');
const protect = require('../middlewares/auth');
const {
    create,
    getAll,
    getById,
    getQRCode,
    cancel,
    track
} = require('../controllers/orderController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/',
    body('restaurantId').notEmpty().withMessage('Restaurant ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.itemId').notEmpty().withMessage('Item ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    create
);

router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/qr', getQRCode);
router.get('/:id/track', track);
router.put('/:id/cancel', cancel);

module.exports = router;

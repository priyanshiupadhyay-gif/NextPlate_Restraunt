const MenuItem = require('../models/MenuItem');
const logger = require('../utils/logger');

// @desc    Get menu item by ID
// @route   GET /api/menu-items/:id
// @access  Public
exports.getById = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id)
            .populate('restaurantId', 'name address contactPhone operatingHours');

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.status(200).json({
            success: true,
            item
        });
    } catch (error) {
        logger.error('Get menu item error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Check item availability
// @route   GET /api/menu-items/:id/availability
// @access  Public
exports.checkAvailability = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id)
            .select('name availableQuantity isAvailable expiryTime pickupTimeSlots');

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        const isValid = item.isValid();
        const isAvailable = item.isAvailable && item.availableQuantity > 0 && isValid;

        res.status(200).json({
            success: true,
            availability: {
                isAvailable,
                quantity: item.availableQuantity,
                expiresAt: item.expiryTime,
                isExpired: !isValid,
                pickupSlots: item.pickupTimeSlots
            }
        });
    } catch (error) {
        logger.error('Check availability error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all categories
// @route   GET /api/menu-items/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await MenuItem.distinct('category', {
            isAvailable: true,
            isApproved: true
        });

        // Category metadata
        const categoryMeta = {
            appetizers: { icon: '🥗', label: 'Appetizers' },
            mains: { icon: '🍛', label: 'Main Course' },
            desserts: { icon: '🍰', label: 'Desserts' },
            beverages: { icon: '🥤', label: 'Beverages' },
            breads: { icon: '🍞', label: 'Breads' },
            rice: { icon: '🍚', label: 'Rice & Biryani' },
            combos: { icon: '🍱', label: 'Combo Meals' },
            snacks: { icon: '🍟', label: 'Snacks' },
            other: { icon: '🍽️', label: 'Other' }
        };

        const enrichedCategories = categories.map(cat => ({
            key: cat,
            ...categoryMeta[cat] || { icon: '🍽️', label: cat }
        }));

        res.status(200).json({
            success: true,
            categories: enrichedCategories
        });
    } catch (error) {
        logger.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Search menu items
// @route   GET /api/menu-items/search
// @access  Public
exports.searchItems = async (req, res) => {
    try {
        const { q, category, maxPrice, isVegetarian, page = 1, limit = 20 } = req.query;

        // Check if user is authenticated NGO
        const isNGO = req.user && req.user.role === 'ngo';

        const query = {
            isAvailable: true,
            isApproved: true,
            availableQuantity: { $gt: 0 }
        };

        // Filter out NGO-only items for non-NGO users
        if (!isNGO) {
            query.listingType = { $ne: 'ngo_only' };
        }

        if (q) {
            query.$text = { $search: q };
        }

        if (category) {
            query.category = category;
        }

        if (maxPrice) {
            query.discountedPrice = { $lte: parseFloat(maxPrice) };
        }

        if (isVegetarian === 'true') {
            query.isVegetarian = true;
        }

        const items = await MenuItem.find(query)
            .populate('restaurantId', 'name address rating contactPhone contactEmail operatingHours')
            .sort({ discountPercentage: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await MenuItem.countDocuments(query);

        res.status(200).json({
            success: true,
            count: items.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            items
        });
    } catch (error) {
        logger.error('Search items error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get featured items (high discounts)
// @route   GET /api/menu-items/featured
// @access  Public
exports.getFeatured = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Check if user is authenticated NGO
        const isNGO = req.user && req.user.role === 'ngo';

        const query = {
            isAvailable: true,
            isApproved: true,
            isFeatured: true,
            availableQuantity: { $gt: 0 }
        };

        // Filter out NGO-only items for non-NGO users
        if (!isNGO) {
            query.listingType = { $ne: 'ngo_only' };
        }

        const items = await MenuItem.find(query)
            .populate('restaurantId', 'name address rating logo contactPhone contactEmail operatingHours')
            .sort({ discountPercentage: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            items
        });
    } catch (error) {
        logger.error('Get featured error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const logger = require('../utils/logger');

// @desc    List nearby restaurants
// @route   GET /api/restaurants
// @access  Public
exports.listNearby = async (req, res) => {
    try {
        const {
            lat,
            lng,
            radius = 10, // km
            page = 1,
            limit = 20,
            cuisine,
            isVegetarian,
            sortBy = 'distance'
        } = req.query;

        const query = { isActive: true, isVerified: true };

        // Filter by cuisine
        if (cuisine) {
            query.cuisine = { $in: cuisine.split(',') };
        }

        let restaurants;

        // Geospatial query if coordinates provided
        if (lat && lng) {
            restaurants = await Restaurant.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [parseFloat(lng), parseFloat(lat)]
                        },
                        distanceField: 'distance',
                        maxDistance: radius * 1000, // Convert to meters
                        query: query,
                        spherical: true
                    }
                },
                { $skip: (page - 1) * limit },
                { $limit: parseInt(limit) }
            ]);

            // Convert distance to km
            restaurants = restaurants.map(r => ({
                ...r,
                distance: (r.distance / 1000).toFixed(2)
            }));
        } else {
            // No location - return all verified restaurants
            restaurants = await Restaurant.find(query)
                .sort(sortBy === 'rating' ? { rating: -1 } : { createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .select('-bankDetails -documents');
        }

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

// @desc    Get restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
exports.getById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id)
            .select('-bankDetails -documents')
            .populate('ownerId', 'fullName');

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            restaurant
        });
    } catch (error) {
        logger.error('Get restaurant error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get restaurant menu
// @route   GET /api/restaurants/:id/menu
// @access  Public
exports.getMenu = async (req, res) => {
    try {
        const { category, isVegetarian, sortBy = 'discount' } = req.query;

        // Check if user is authenticated NGO
        const isNGO = req.user && req.user.role === 'ngo';

        const query = {
            restaurantId: req.params.id,
            isAvailable: true,
            isApproved: true,
            availableQuantity: { $gt: 0 }
        };

        // Filter out NGO-only items for non-NGO users
        if (!isNGO) {
            query.listingType = { $ne: 'ngo_only' };
        }

        if (category) {
            query.category = category;
        }

        if (isVegetarian === 'true') {
            query.isVegetarian = true;
        }

        let sortOptions = {};
        switch (sortBy) {
            case 'price_low':
                sortOptions = { discountedPrice: 1 };
                break;
            case 'price_high':
                sortOptions = { discountedPrice: -1 };
                break;
            case 'discount':
                sortOptions = { discountPercentage: -1 };
                break;
            case 'popular':
                sortOptions = { orderCount: -1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        const menuItems = await MenuItem.find(query)
            .sort(sortOptions)
            .select('-nutritionInfo');

        // Group by category
        const groupedMenu = menuItems.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            count: menuItems.length,
            menu: groupedMenu,
            items: menuItems
        });
    } catch (error) {
        logger.error('Get menu error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Search restaurants
// @route   GET /api/restaurants/search
// @access  Public
exports.search = async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const restaurants = await Restaurant.find({
            $text: { $search: q },
            isActive: true,
            isVerified: true
        })
            .select('-bankDetails -documents')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: restaurants.length,
            restaurants
        });
    } catch (error) {
        logger.error('Search restaurants error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Filter restaurants
// @route   POST /api/restaurants/filter
// @access  Public
exports.filter = async (req, res) => {
    try {
        const {
            cuisines,
            minRating,
            maxDistance,
            hasVegetarian,
            isOpen,
            lat,
            lng,
            page = 1,
            limit = 20
        } = req.body;

        const query = { isActive: true, isVerified: true };

        if (cuisines && cuisines.length > 0) {
            query.cuisine = { $in: cuisines };
        }

        if (minRating) {
            query.rating = { $gte: parseFloat(minRating) };
        }

        let restaurants;

        if (lat && lng && maxDistance) {
            restaurants = await Restaurant.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [parseFloat(lng), parseFloat(lat)]
                        },
                        distanceField: 'distance',
                        maxDistance: maxDistance * 1000,
                        query: query,
                        spherical: true
                    }
                },
                { $skip: (page - 1) * limit },
                { $limit: parseInt(limit) }
            ]);
        } else {
            restaurants = await Restaurant.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .select('-bankDetails -documents');
        }

        res.status(200).json({
            success: true,
            count: restaurants.length,
            restaurants
        });
    } catch (error) {
        logger.error('Filter restaurants error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all unique cuisines
// @route   GET /api/restaurants/cuisines
// @access  Public
exports.getCuisines = async (req, res) => {
    try {
        const cuisines = await Restaurant.distinct('cuisine', {
            isActive: true,
            isVerified: true
        });

        res.status(200).json({
            success: true,
            cuisines: cuisines.sort()
        });
    } catch (error) {
        logger.error('Get cuisines error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

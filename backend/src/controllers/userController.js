const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                avatarUrl: user.avatarUrl,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
                isVerifiedNGO: user.isVerifiedNGO,
                ngoVerificationStatus: user.ngoVerificationStatus,
                totalCarbonSaved: user.totalCarbonSaved,
                totalMealsRescued: user.totalMealsRescued,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const allowedUpdates = ['fullName', 'phoneNumber', 'avatarUrl'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        logger.info(`User profile updated: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                avatarUrl: user.avatarUrl,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Upload profile image
// @route   PUT /api/users/profile-image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Image URL is required'
            });
        }

        // TODO: Integrate with cloud storage (S3/Cloudinary)
        // For now, accept the URL directly

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatarUrl: imageUrl },
            { new: true }
        );

        logger.info(`Profile image updated: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Profile image updated',
            avatarUrl: user.avatarUrl
        });
    } catch (error) {
        logger.error('Upload profile image error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Soft delete - mark as inactive instead of removing
        user.isActive = false;
        user.email = `deleted_${Date.now()}_${user.email}`;
        await user.save();

        logger.info(`Account deleted: ${user._id}`);

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        logger.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user's saved addresses
// @route   GET /api/users/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            addresses: user.addresses || []
        });
    } catch (error) {
        logger.error('Get addresses error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add new address
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = async (req, res) => {
    try {
        const { label, street, city, state, zipCode, isDefault } = req.body;

        const user = await User.findById(req.user.id);

        if (!user.addresses) {
            user.addresses = [];
        }

        // If this is set as default, unset others
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push({
            label,
            street,
            city,
            state,
            zipCode,
            isDefault: isDefault || user.addresses.length === 0
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            addresses: user.addresses
        });
    } catch (error) {
        logger.error('Add address error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user impact stats (meals saved, CO2 saved, money saved)
// @route   GET /api/users/impact
// @access  Private
exports.getImpactStats = async (req, res) => {
    try {
        const Order = require('../models/Order');

        // Get all completed orders for this user
        const completedOrders = await Order.find({
            customerId: req.user.id,
            orderStatus: 'completed'
        });

        const mealsSaved = completedOrders.length;

        // Estimate ~0.8kg CO2 saved per rescued meal (industry average)
        const co2Saved = (mealsSaved * 0.8).toFixed(1);

        // Sum up savings: difference between original and discounted prices
        let moneySaved = 0;
        completedOrders.forEach(order => {
            // discountAmount stored on each order represents total savings
            moneySaved += order.discountAmount || 0;
        });

        res.status(200).json({
            success: true,
            impact: {
                mealsSaved,
                co2Saved: `${co2Saved}kg`,
                moneySaved: `$${Math.round(moneySaved)}`
            }
        });
    } catch (error) {
        logger.error('Get impact stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// @desc    Get NGO metrics (claims this week, tier info)
// @route   GET /api/v1/users/ngo-metrics
// @access  Private (NGO)
exports.getNGOMetrics = async (req, res) => {
    try {
        const Order = require('../models/Order');

        // Start of current week (Sunday)
        const startOfWeek = new Date();
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const claimsThisWeek = await Order.countDocuments({
            customerId: req.user.id,
            createdAt: { $gte: startOfWeek }
        });

        res.status(200).json({
            success: true,
            claimsThisWeek,
            status: req.user.ngoVerificationStatus,
            isVerified: req.user.isVerifiedNGO
        });
    } catch (error) {
        logger.error('Get NGO metrics error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Get user's impact milestone certificates
 * @route   GET /api/users/certificates
 * @access  Private
 */
exports.getCertificates = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const milestones = [
            { id: 'carbon-10', name: 'Eco-Warrior', threshold: 10, type: 'carbon', icon: '🌱', description: 'Saved 10kg of CO2 from the atmosphere.' },
            { id: 'carbon-50', name: 'Resilience Legend', threshold: 50, type: 'carbon', icon: '🌳', description: 'Saved 50kg of CO2 from the atmosphere.' },
            { id: 'meals-25', name: 'Community Hero', threshold: 25, type: 'meals', icon: '🍱', description: 'Rescued 25 meals for the community.' },
            { id: 'meals-100', name: 'Zero-Waste Titan', threshold: 100, type: 'meals', icon: '🏆', description: 'Rescued 100 meals for the community.' }
        ];

        const certificates = milestones.map(m => {
            const current = m.type === 'carbon' ? user.totalCarbonSaved : user.totalMealsRescued;
            const earned = current >= m.threshold;
            return {
                ...m,
                earned,
                earnedDate: earned ? user.updatedAt : null, // Mocking date for now
                progress: Math.min(100, Math.round((current / m.threshold) * 100))
            };
        });

        res.status(200).json({
            success: true,
            certificates
        });
    } catch (error) {
        logger.error('Get certificates error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve resilience records' });
    }
};

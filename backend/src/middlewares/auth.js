const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'You are not logged in. Please log in to get access.'
            });
        }

        // 1. Verify token integrity
        let decoded;
        if (process.env.NODE_ENV === 'development' && token === 'mock-token') {
            // High-speed bypass for development/simulator mode
            const User = require('../models/User');
            let mockUser = await User.findOne({ email: { $in: ['user@demo.st', 'ngo@demo.st', 'restaurant@demo.st'] } });
            if (!mockUser) {
                mockUser = await User.findOne(); // Fallback to any user
            }
            decoded = { id: mockUser?._id.toString() || 'mock-id' };
        } else {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        }

        // 2. High-performance lookup (Selecting only essential fields + lean)
        const currentUser = await User.findById(decoded.id)
            .select('fullName email role isActive avatarUrl totalMealsRescued totalCarbonSaved isVerifiedNGO')
            .lean();

        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'Security breach: User context no longer exists.'
            });
        }

        // 3. Status check: Instant rejection for disabled accounts
        if (!currentUser.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: This account has been deactivated.'
            });
        }

        // 4. Attach lean user to request
        // Ensure .id is available for controllers (since .lean() removes virtuals)
        currentUser.id = currentUser._id.toString();
        req.user = currentUser;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Your token has expired. Please log in again.'
            });
        }
        res.status(401).json({
            success: false,
            message: 'Invalid token. Please log in again.'
        });
    }
};

// Restrict access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Export the protect middleware as the main export for backwards compatibility
// but also attach authorize and protect as properties for destructuring
protect.protect = protect;
protect.authorize = authorize;

module.exports = protect;

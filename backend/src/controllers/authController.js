const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const OTP = require('../models/OTP');
const { generateToken, generateRefreshToken } = require('../services/tokenService');
const crypto = require('crypto');
const disposableEmails = require('disposable-email-domains');

// Helper to check for disposable emails
const isDisposableEmail = (email) => {
    const domain = email.split('@')[1];
    return disposableEmails.includes(domain);
};

const emailService = require('../services/emailService');
const twilioService = require('../services/twilioService');

exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role, phoneNumber, ngoRegNumber, ngoName, ngoAddress, ngoMission } = req.body;
        const logger = require('../utils/logger');
        logger.info(`Registration attempt: ${email} as ${role || 'user'}`);

        // 1. Structural Validation
        if (!fullName || !email || !password) {
            logger.warn(`Registration rejected: Missing credentials for ${email}`);
            return res.status(400).json({ success: false, message: 'Missing required credentials.' });
        }

        // 2. Security: Disposable Email check
        if (isDisposableEmail(email)) {
            logger.warn(`Registration rejected: Disposable email ${email}`);
            return res.status(400).json({
                success: false,
                message: 'Temporary/disposable email domains are blocked for security.'
            });
        }

        // 3. Check Collision
        const existingUser = await User.findOne({
            $or: [
                { email },
                ...(phoneNumber ? [{ phoneNumber }] : [])
            ]
        }).lean();

        if (existingUser) {
            const isEmailCollision = existingUser.email === email;
            logger.warn(`Registration rejected: ${isEmailCollision ? 'Email' : 'Phone'} collision for ${isEmailCollision ? email : phoneNumber}`);

            const roleLabels = { 'user': 'Foodie', 'restaurant': 'Partner', 'ngo': 'Hero', 'admin': 'Admin' };
            const existingRoleLabel = roleLabels[existingUser.role] || 'User';

            return res.status(400).json({
                success: false,
                message: isEmailCollision
                    ? `This identity is already active as a ${existingRoleLabel} account. Please use a distinct email.`
                    : `This phone number is already linked to a ${existingRoleLabel} account.`
            });
        }

        // 4. Cryptographic Verification Token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // 5. Scalable Role Assignment
        const validRoles = ['user', 'ngo', 'restaurant'];
        const assignedRole = validRoles.includes(role) ? role : 'user';

        // Generate 6-digit OTP
        const emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const emailOTPExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = await User.create({
            fullName,
            email,
            password,
            phoneNumber,
            verificationToken,
            emailOTP,
            emailOTPExpires,
            role: assignedRole,
            ngoName: assignedRole === 'ngo' ? ngoName : undefined,
            ngoRegNumber: assignedRole === 'ngo' ? ngoRegNumber : undefined,
            ngoAddress: assignedRole === 'ngo' ? ngoAddress : undefined,
            ngoMission: assignedRole === 'ngo' ? ngoMission : undefined,
            isVerifiedNGO: false,
            isActive: true, // Default to active
            loginCount: 0
        });

        // 6. Async Background Tasks
        // Verification email (Non-blocking to prevent UI hang)
        emailService.sendVerificationEmail(email, verificationToken, emailOTP).catch(mailError => {
            logger.error(`Registration email background failure: ${mailError.message}`);
        });

        res.status(201).json({
            success: true,
            message: 'Account created! Please verify your email to activate your account.',
            role: assignedRole
        });
    } catch (error) {
        const logger = require('../utils/logger');
        logger.error(`Registration protocol failure: ${error.message}`);

        // Mongoose validation or duplicate key errors should be 400
        const statusCode = error.name === 'ValidationError' || error.code === 11000 ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            message: error.code === 11000 ? 'Identity collision: Email or Phone already registered.' : error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Missing credentials.' });
        }

        // 1. Core Identity Retrieval
        const user = await User.findOne({ email }).select('+password');

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // 2. Authentication
        const isMatch = await user.comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // 3. Verification Enforcement (Allow login if either email OR phone is verified)
        if (!user.isEmailVerified && !user.isPhoneVerified) {
            return res.status(403).json({
                success: true,
                requiresVerification: true,
                message: 'Please verify your identity via the link sent to your email to proceed.',
                phone: user.phoneNumber // Let frontend know which phone to verify
            });
        }

        // 4. Role-Specific Business Logic
        let restaurantData = null;
        if (user.role === 'restaurant') {
            const Restaurant = require('../models/Restaurant');
            const restaurant = await Restaurant.findOne({ ownerId: user._id }).lean();

            if (!restaurant) {
                return res.status(404).json({
                    success: false,
                    message: 'No restaurant profiles found for this account.'
                });
            }

            if (!restaurant.isVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Your partner application is currently under review.'
                });
            }

            restaurantData = {
                id: restaurant._id,
                name: restaurant.name,
                isVerified: restaurant.isVerified,
                isActive: restaurant.isActive
            };
        }

        // 5. Token Authorization
        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // 6. Persistence & Analytics
        user.lastLogin = Date.now();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                totalMealsRescued: user.totalMealsRescued,
                totalCarbonSaved: user.totalCarbonSaved,
                isVerifiedNGO: user.isVerifiedNGO
            },
            restaurant: restaurantData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Invalid verification link.' });
        }

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'This link has expired or is invalid.'
            });
        }

        // Atomic activation
        user.isEmailVerified = true;
        user.emailVerifiedAt = Date.now();
        user.verificationToken = undefined; // Token rotation/expiration
        await user.save();

        // Generate tokens for auto-login
        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Email Verified. Your account is now active on the Grid.',
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.verifyRegistrationOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
        }

        const user = await User.findOne({
            email,
            emailOTP: otp,
            emailOTPExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP code.'
            });
        }

        // Atomic activation
        user.isEmailVerified = true;
        user.emailVerifiedAt = Date.now();
        user.verificationToken = undefined;
        user.emailOTP = undefined;
        user.emailOTPExpires = undefined;
        await user.save();

        // Generate tokens for auto-login
        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Email Verified successfully via OTP!',
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
    try {
        const { idToken, role, ngoName, ngoRegNumber, ngoAddress, ngoMission, restaurantName, address, city, description, cuisineType } = req.body;
        const logger = require('../utils/logger');
        const Restaurant = require('../models/Restaurant');

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { sub: googleId, email, name, picture: avatarUrl } = ticket.getPayload();

        let user = await User.findOne({
            $or: [{ googleId }, { email }]
        });

        const assignedRole = role || 'user';

        if (!user) {
            user = await User.create({
                fullName: name,
                email,
                googleId,
                avatarUrl,
                role: assignedRole,
                ngoName: assignedRole === 'ngo' ? ngoName : undefined,
                ngoRegNumber: assignedRole === 'ngo' ? ngoRegNumber : undefined,
                ngoAddress: assignedRole === 'ngo' ? ngoAddress : undefined,
                ngoMission: assignedRole === 'ngo' ? ngoMission : undefined,
                isEmailVerified: true
            });
            logger.info(`New ${assignedRole} created via Google: ${email}`);
        } else {
            // Update existing user with Google ID and potentially new role if they were a basic user
            let updated = false;
            if (!user.googleId) {
                user.googleId = googleId;
                user.isEmailVerified = true;
                updated = true;
            }
            if (role && user.role === 'user' && role !== 'user') {
                user.role = role;
                if (role === 'ngo') {
                    user.ngoName = ngoName;
                    user.ngoRegNumber = ngoRegNumber;
                    user.ngoAddress = ngoAddress;
                    user.ngoMission = ngoMission;
                }
                updated = true;
            }
            if (updated) await user.save();
        }

        // Handle Restaurant side-effect if applicable
        if (assignedRole === 'restaurant' && restaurantName) {
            const existingRest = await Restaurant.findOne({ ownerId: user._id });
            if (!existingRest) {
                await Restaurant.create({
                    name: restaurantName,
                    description: description || '',
                    cuisine: cuisineType ? [cuisineType] : [],
                    address: {
                        street: address || 'Pending',
                        city: city || 'Pending',
                        state: 'Pending',
                        zipCode: '000000',
                        location: { type: 'Point', coordinates: [0, 0] }
                    },
                    contactEmail: email,
                    ownerId: user._id,
                    isVerified: false
                });
                logger.info(`Restaurant profile created for Google user: ${restaurantName}`);
            }
        }

        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// twilioService is already required at the top

exports.sendEmailOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Generate 6 digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await OTP.create({
            email,
            code,
            type: 'email',
            expiresAt
        });

        await emailService.sendOTPEmail(email, code);

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.verifyEmailOTP = async (req, res) => {
    try {
        const { email, code } = req.body;

        // Master OTP for development/testing
        const isMasterOTP = code === '123456';
        let otpDoc;

        if (isMasterOTP) {
            // Master OTP logic
            // We still want to find or create the user later, so we just proceed
        } else {
            otpDoc = await OTP.findOne({
                email,
                code: code.toString(),
                type: 'email',
                verified: false
            });

            if (!otpDoc) {
                logger.debug(`No valid OTP found in DB for ${email} with code ${code}`);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired OTP'
                });
            }

            otpDoc.verified = true;
            await otpDoc.save();
        }

        let user = await User.findOne({ email });
        if (!user) {
            // Create user if doesn't exist (Quick Sign-In flow)
            user = await User.create({
                fullName: email.split('@')[0], // Use email prefix as name
                email,
                isEmailVerified: true
            });
        } else {
            user.isEmailVerified = true;
            await user.save();
        }

        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl
            }
        });
    } catch (error) {
        console.error('❌ ERROR in verifyEmailOTP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.sendWhatsAppOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        // Use Twilio Verify service — SMS channel
        await twilioService.sendVerifyOTP(phoneNumber, 'sms');

        res.status(200).json({
            success: true,
            message: 'Verification code sent to your phone via SMS'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.verifyWhatsAppOTP = async (req, res) => {
    try {
        const { phoneNumber, code } = req.body;

        const verifyCheck = await twilioService.checkVerifyOTP(phoneNumber, code);

        if (verifyCheck.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: verifyCheck.error || 'Invalid or expired verification code'
            });
        }

        let user = await User.findOne({ phoneNumber });
        if (!user) {
            user = await User.create({
                fullName: 'New User',
                phoneNumber,
                isPhoneVerified: true
            });
        } else {
            user.isPhoneVerified = true;
            await user.save();
        }

        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const appleSignin = require('apple-signin-auth');

exports.appleLogin = async (req, res) => {
    try {
        const { identityToken, user: appleUser } = req.body;

        const { sub: appleId, email, name: tokenName } = await appleSignin.verifyIdToken(identityToken, {
            audience: process.env.APPLE_CLIENT_ID,
            ignoreExpiration: true
        });

        let user = await User.findOne({
            $or: [{ appleId }, { email }]
        });

        if (!user) {
            user = await User.create({
                fullName: appleUser?.name ? `${appleUser.name.firstName} ${appleUser.name.lastName}` : (tokenName || 'Apple User'),
                email,
                appleId,
                isEmailVerified: true
            });
        } else if (!user.appleId) {
            user.appleId = appleId;
            user.isEmailVerified = true;
            await user.save();
        }

        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const jwt = require('jsonwebtoken');

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists'
            });
        }

        const accessToken = generateToken(user._id);

        res.status(200).json({
            success: true,
            accessToken
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
};

exports.getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
};

exports.submitRestaurantApplication = async (req, res, next) => {
    try {
        const { ownerName, ownerEmail, ownerPhone, restaurantName, address, city, description, cuisineType } = req.body;
        const logger = require('../utils/logger');

        let owner = await User.findOne({ email: ownerEmail });
        if (owner && owner.role !== 'restaurant') {
            owner.role = 'restaurant';
            if (ownerPhone) owner.phoneNumber = ownerPhone;
            await owner.save();
        }

        const existingRestaurant = owner ? await Restaurant.findOne({ ownerId: owner._id }) : null;
        if (existingRestaurant) {
            return res.status(400).json({
                success: false,
                message: 'A restaurant application already exists for this account'
            });
        }

        const restaurant = await Restaurant.create({
            name: restaurantName,
            description: description || '',
            cuisine: cuisineType ? [cuisineType] : [],
            address: {
                street: address || 'Pending',
                city: city || 'Pending',
                state: 'Pending',
                zipCode: '000000',
                location: {
                    type: 'Point',
                    coordinates: [0, 0]
                }
            },
            contactPhone: ownerPhone || '0000000000',
            contactEmail: ownerEmail,
            ownerId: owner ? owner._id : null,
            isVerified: false
        });

        logger.info(`Restaurant application submitted: ${restaurantName} by ${ownerEmail}`);

        res.status(201).json({
            success: true,
            message: 'Restaurant application submitted successfully. Our team will review and get back to you.',
            data: { id: restaurant._id, name: restaurant.name }
        });
    } catch (error) {
        const logger = require('../utils/logger');
        logger.error(`Restaurant application error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit application'
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // Security: Don't reveal if user exists, but for demo we can be helpful
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a reset link will be sent.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

        await user.save();

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await emailService.sendPasswordResetEmail(user.email, resetUrl);

        res.status(200).json({
            success: true,
            message: 'Password reset link sent to your email.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token.'
            });
        }

        // Set new password (model pre-save middleware will hash it)
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful! You can now log in with your new password.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { register, login, verifyEmail, googleLogin, sendEmailOTP, verifyEmailOTP, verifyRegistrationOTP, sendWhatsAppOTP, verifyWhatsAppOTP, appleLogin, refreshToken, getMe, submitRestaurantApplication, forgotPassword, resetPassword } = require('../controllers/authController');
const protect = require('../middlewares/auth');

const router = express.Router();

const validateRegister = [
    body('fullName').notEmpty().trim().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('phoneNumber').optional().isMobilePhone().withMessage('Valid phone number is required if provided')
];

const validateLogin = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', validateRegister, validate, register);
router.post('/login', validateLogin, validate, login);
router.get('/verify-email', verifyEmail);

router.post('/google', body('idToken').notEmpty().withMessage('ID token is required'), validate, googleLogin);

router.post('/email/send-otp',
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    validate,
    sendEmailOTP
);

router.post('/email/verify-otp',
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    validate,
    verifyEmailOTP
);

router.post('/verify-registration-otp',
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    validate,
    verifyRegistrationOTP
);

router.post('/whatsapp/send-otp',
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    validate,
    sendWhatsAppOTP
);

router.post('/whatsapp/verify-otp',
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    validate,
    verifyWhatsAppOTP
);

router.post('/apple', body('identityToken').notEmpty().withMessage('Identity token is required'), validate, appleLogin);

router.post('/refresh', body('refreshToken').notEmpty().withMessage('Refresh token is required'), validate, refreshToken);

router.get('/me', protect, getMe);

router.post('/restaurant-application',
    body('ownerEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('restaurantName').notEmpty().trim().withMessage('Restaurant name is required'),
    validate,
    submitRestaurantApplication
);

router.post('/forgot-password',
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    validate,
    forgotPassword
);

router.post('/reset-password',
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    validate,
    resetPassword
);

module.exports = router;

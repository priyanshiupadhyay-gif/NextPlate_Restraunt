const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide your full name'],
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: false,
        minlength: 8,
        select: false
    },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'restaurant', 'admin', 'ngo'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerifiedAt: Date,
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    phoneVerifiedAt: Date,

    totalCarbonSaved: {
        type: Number,
        default: 0
    },
    totalMealsRescued: {
        type: Number,
        default: 0
    },

    isVerifiedNGO: {
        type: Boolean,
        default: false
    },
    ngoName: {
        type: String,
        trim: true
    },
    ngoRegNumber: {
        type: String,
        trim: true
    },
    ngoAddress: {
        type: String,
        trim: true
    },
    ngoMission: {
        type: String,
        trim: true
    },
    ngoVerificationStatus: {
        type: String,
        enum: ['none', 'pending', 'verified', 'rejected'],
        default: 'none'
    },
    ngoVerificationDocUrl: {
        type: String,
        default: null
    },
    ngoImpactScore: {
        type: Number,
        default: 0
    },

    googleId: {
        type: String,
        index: true
    },
    appleId: {
        type: String,
        index: true
    },

    avatarUrl: String,
    verificationToken: String,
    emailOTP: String,
    emailOTPExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0
    },

    fcmToken: {
        type: String,
        default: null,
    },
    whatsappOptIn: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ email: 1, role: 1 });
userSchema.index({ isEmailVerified: 1 });
userSchema.index({ ngoVerificationStatus: 1 });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const saltRounds = parseInt(process.env.BCRYPT_COST) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
    if (!userPassword) return false;
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.virtual('initials').get(function () {
    if (!this.fullName) return '';
    const parts = this.fullName.split(' ');
    return parts.length > 1
        ? parts[0][0] + parts[parts.length - 1][0]
        : parts[0].substring(0, 2);
});

const User = mongoose.model('User', userSchema);

module.exports = User;

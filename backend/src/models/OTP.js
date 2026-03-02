const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    phoneNumber: String,
    email: String,
    code: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['phone', 'email', 'password_reset'],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index to automatically delete document
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;

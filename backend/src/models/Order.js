const mongoose = require('mongoose');
const crypto = require('crypto');

const orderItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    name: String, // Snapshot at order time
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true
    },
    customizations: {
        spiceLevel: String,
        portion: String,
        addOns: [{
            name: String,
            price: Number
        }]
    },
    itemTotal: {
        type: Number,
        required: true
    },
    carbonScore: {
        type: Number,
        default: 0 // Snapshot at order time
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    totalCarbonSaved: {
        type: Number,
        default: 0
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: {
        type: String
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'wallet', 'cod', 'google', 'apple', 'crypto'],
        default: 'card'
    },
    orderStatus: {
        type: String,
        enum: ['placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
        default: 'placed'
    },
    pickupTimeSlot: {
        startTime: String,
        endTime: String,
        date: Date
    },
    qrCode: {
        type: String
    },
    qrData: {
        type: String
    },
    qrVerified: {
        type: Boolean,
        default: false
    },
    qrVerifiedAt: {
        type: Date
    },
    specialInstructions: {
        type: String,
        maxlength: 500
    },
    cancellationReason: {
        type: String
    },
    cancelledBy: {
        type: String,
        enum: ['customer', 'restaurant', 'admin', 'system']
    },
    cancelledAt: {
        type: Date
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundId: {
        type: String
    },
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String
    }],

    // NGO Logistics
    assignedNGO: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dispatchStatus: {
        type: String,
        enum: ['pending', 'dispatching', 'dispatched', 'delivered', null],
        default: null
    },
    dispatchedAt: Date,

    // Soft Delete
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    deletedBy: {
        type: String,
        enum: ['customer', 'restaurant', 'admin', 'system', 'ngo', null],
        default: null
    },

    // AI Rescue Audit
    rescueAudit: {
        submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        submittedAt: Date,
        verdict: { type: String, enum: ['APPROVED', 'FLAGGED', 'REJECTED'] },
        conditionRating: { type: Number, min: 1, max: 5 },
        quantityMatch: String,
        auditNote: String,
        safetyConcerns: [String]
    }
}, {
    timestamps: true
});

// Generate order number before save
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.orderNumber = `NP-${dateStr}-${random}`;
    }
    next();
});

// Generate QR code data
orderSchema.methods.generateQRData = function () {
    const data = {
        orderId: this._id.toString(),
        orderNumber: this.orderNumber,
        customerId: this.customerId.toString(),
        restaurantId: this.restaurantId.toString(),
        timestamp: new Date().toISOString()
    };

    const checksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(data) + process.env.JWT_ACCESS_SECRET)
        .digest('hex')
        .substring(0, 16);

    data.checksum = checksum;
    this.qrData = JSON.stringify(data);
    return this.qrData;
};

// Validate QR code
orderSchema.statics.validateQRCode = function (qrData) {
    try {
        const data = JSON.parse(qrData);
        const { checksum, ...rest } = data;

        const expectedChecksum = crypto
            .createHash('sha256')
            .update(JSON.stringify(rest) + process.env.JWT_ACCESS_SECRET)
            .digest('hex')
            .substring(0, 16);

        return checksum === expectedChecksum;
    } catch (error) {
        return false;
    }
};

// Update status with history
orderSchema.methods.updateStatus = async function (newStatus, note = '') {
    this.orderStatus = newStatus;
    this.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note
    });
    return this.save();
};

// Index for efficient queries
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
// orderNumber already has unique:true which creates an index automatically
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ isDeleted: 1, orderStatus: 1 });

// Pre-query hook: auto-exclude soft-deleted records
orderSchema.pre(/^find/, function (next) {
    if (this.getFilter().includeDeleted !== true) {
        this.where({ isDeleted: { $ne: true } });
    } else {
        delete this.getFilter().includeDeleted;
    }
    next();
});

// Soft delete method
orderSchema.methods.softDelete = async function (deletedBy = 'system') {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

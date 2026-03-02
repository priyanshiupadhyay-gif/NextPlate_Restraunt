const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
    },
    requestType: {
        type: String,
        enum: ['add_item', 'edit_item', 'delete_item', 'update_info'],
        required: true
    },
    requestData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    previousData: {
        type: mongoose.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewNotes: {
        type: String,
        maxlength: 500
    },
    reviewedAt: {
        type: Date
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
changeRequestSchema.index({ restaurantId: 1, status: 1 });
changeRequestSchema.index({ status: 1, createdAt: -1 });

// Method to approve request
changeRequestSchema.methods.approve = async function (adminId, notes = '') {
    this.status = 'approved';
    this.reviewedBy = adminId;
    this.reviewNotes = notes;
    this.reviewedAt = new Date();
    return this.save();
};

// Method to reject request
changeRequestSchema.methods.reject = async function (adminId, notes) {
    this.status = 'rejected';
    this.reviewedBy = adminId;
    this.reviewNotes = notes;
    this.reviewedAt = new Date();
    return this.save();
};

const ChangeRequest = mongoose.model('ChangeRequest', changeRequestSchema);

module.exports = ChangeRequest;

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['order', 'promotion', 'system', 'reminder', 'alert'],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    body: {
        type: String,
        required: true,
        maxlength: 500
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    actionUrl: {
        type: String
    },
    imageUrl: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    isPushSent: {
        type: Boolean,
        default: false
    },
    pushSentAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Mark as read
notificationSchema.methods.markAsRead = async function () {
    if (!this.isRead) {
        this.isRead = true;
        this.readAt = new Date();
        return this.save();
    }
    return this;
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function (userId) {
    return this.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
    );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (userId) {
    return this.countDocuments({ userId, isRead: false });
};

// Static method to create order notification
notificationSchema.statics.createOrderNotification = async function (userId, orderId, type, restaurantName) {
    const templates = {
        confirmed: {
            title: 'Order Confirmed',
            body: `Your order has been confirmed by ${restaurantName}. Get ready to pick up!`
        },
        preparing: {
            title: 'Being Prepared',
            body: `${restaurantName} is preparing your order now.`
        },
        ready: {
            title: 'Ready for Pickup! 🎉',
            body: `Your food is ready! Head to ${restaurantName} and show your QR code.`
        },
        cancelled: {
            title: 'Order Cancelled',
            body: 'Your order has been cancelled. Refund will be processed shortly.'
        }
    };

    const template = templates[type];
    if (!template) return null;

    return this.create({
        userId,
        type: 'order',
        title: template.title,
        body: template.body,
        data: { orderId, actionType: type }
    });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Restaurant name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    cuisine: [{
        type: String,
        trim: true
    }],
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, default: 'India' },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true
            }
        }
    },
    operatingHours: {
        monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
        tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
        wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
        thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
        friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
        saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
        sunday: { open: String, close: String, isClosed: { type: Boolean, default: false } }
    },
    contactPhone: {
        type: String,
        required: [true, 'Contact phone is required']
    },
    contactEmail: {
        type: String,
        lowercase: true
    },
    images: [{
        type: String // URLs
    }],
    logo: {
        type: String
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bankDetails: {
        accountName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String
    },
    documents: {
        fssaiLicense: String,
        gstNumber: String,
        panNumber: String
    },
    commissionPercentage: {
        type: Number,
        default: 15,
        min: 0,
        max: 50
    }
}, {
    timestamps: true
});

// Index for geospatial queries
restaurantSchema.index({ 'address.location': '2dsphere' });

// Index for text search
restaurantSchema.index({ name: 'text', description: 'text', cuisine: 'text' });

// Virtual for checking if restaurant is currently open
restaurantSchema.virtual('isCurrentlyOpen').get(function () {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    const hours = this.operatingHours[today];

    if (!hours || hours.isClosed) return false;

    const currentTime = now.getHours() * 100 + now.getMinutes();
    const openTime = parseInt(hours.open?.replace(':', '') || '0');
    const closeTime = parseInt(hours.close?.replace(':', '') || '0');

    return currentTime >= openTime && currentTime <= closeTime;
});

// Method to calculate distance from a point
restaurantSchema.methods.distanceFrom = function (lat, lng) {
    const R = 6371; // Earth's radius in km
    const dLat = (this.address.location.coordinates[1] - lat) * Math.PI / 180;
    const dLon = (this.address.location.coordinates[0] - lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(this.address.location.coordinates[1] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;

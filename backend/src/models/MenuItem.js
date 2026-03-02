const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [300, 'Description cannot exceed 300 characters']
    },
    category: {
        type: String,
        required: true,
        enum: [
            'appetizers', 'mains', 'desserts', 'beverages', 'breads', 'rice', 'combos', 'snacks',
            'bakery', 'dairy', 'produce', 'meat_seafood', 'prepared_meals', 'sides',
            'other'
        ]
    },
    originalPrice: {
        type: Number,
        required: [true, 'Original price is required'],
        min: 0
    },
    discountedPrice: {
        type: Number,
        required: [true, 'Discounted price is required'],
        min: 0
    },
    discountPercentage: {
        type: Number,
        min: 0,
        max: 100
    },
    images: [{
        type: String
    }],
    isVegetarian: {
        type: Boolean,
        default: false
    },
    isVegan: {
        type: Boolean,
        default: false
    },
    isGlutenFree: {
        type: Boolean,
        default: false
    },
    allergens: [{
        type: String,
        enum: [
            'nuts', 'dairy', 'eggs', 'soy', 'wheat', 'shellfish', 'fish',
            'peanuts', 'tree_nuts', 'wheat_gluten'
        ]
    }],
    customizationOptions: {
        spiceLevel: [{
            type: String,
            enum: ['mild', 'medium', 'hot', 'extra-hot']
        }],
        portions: [{
            name: String,
            priceModifier: { type: Number, default: 0 }
        }],
        addOns: [{
            name: String,
            price: Number
        }]
    },
    availableQuantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    pickupTimeSlots: [{
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        maxOrders: { type: Number, default: 10 }
    }],
    expiryTime: {
        type: Date
    },
    preparationTime: {
        type: Number, // in minutes
        default: 15
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    nutritionInfo: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number
    },
    orderCount: {
        type: Number,
        default: 0
    },
    carbonScore: {
        type: Number,
        default: 0 // kg CO2 saved per unit
    },
    isDonationEligible: {
        type: Boolean,
        default: false
    },
    listingType: {
        type: String,
        enum: ['ngo_only', 'user_only', 'both'],
        default: 'both'
    },
    ngoPrice: {
        type: Number,
        min: 0,
        default: 0
    },
    isAdaptivePricing: {
        type: Boolean,
        default: false
    },
    baseDiscountedPrice: {
        type: Number,
        default: 0 // Original discounted price to calculate from
    }
}, {
    timestamps: true
});

// Calculate discount percentage and normalize expiryTime before save
menuItemSchema.pre('save', function (next) {
    if (this.originalPrice && this.discountedPrice) {
        this.discountPercentage = Math.round(
            ((this.originalPrice - this.discountedPrice) / this.originalPrice) * 100
        );
    }
    // Normalize expiryTime: if it's a time string like "11:22", convert to a Date for today
    if (this.expiryTime && typeof this.expiryTime === 'string' && /^\d{2}:\d{2}$/.test(this.expiryTime)) {
        const [hours, minutes] = this.expiryTime.split(':').map(Number);
        const now = new Date();
        now.setHours(hours, minutes, 0, 0);
        this.expiryTime = now;
    }

    // Set default carbonScore based on category if not provided
    if (this.carbonScore === 0) {
        const categoryScores = {
            'meat_seafood': 5.0,
            'dairy': 2.5,
            'mains': 1.8,
            'prepared_meals': 1.5,
            'bakery': 0.8,
            'breads': 0.6,
            'produce': 0.5,
            'appetizers': 0.7,
            'sides': 0.5,
            'desserts': 0.8,
            'snacks': 0.6,
            'combos': 2.0,
            'rice': 0.4,
            'beverages': 0.2,
            'other': 0.8
        };
        this.carbonScore = categoryScores[this.category] || 0.8;
    }
    next();
});

// Index for efficient queries
menuItemSchema.index({ restaurantId: 1, isAvailable: 1, isApproved: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });
// Compound indexes for common query patterns
menuItemSchema.index({ isDonationEligible: 1, isAvailable: 1, availableQuantity: 1 }); // NGO donation queries
menuItemSchema.index({ expiryTime: 1, isAvailable: 1, availableQuantity: 1 }); // AI rescue strategy lookups
menuItemSchema.index({ restaurantId: 1, createdAt: -1 }); // Restaurant listing sort
menuItemSchema.index({ category: 1, isAvailable: 1, discountedPrice: 1 }); // User browsing

// Virtual for savings amount
menuItemSchema.virtual('savingsAmount').get(function () {
    return this.originalPrice - this.discountedPrice;
});

// Method to check if item is still valid (not expired)
menuItemSchema.methods.isValid = function () {
    if (!this.expiryTime) return true;
    return new Date() < this.expiryTime;
};

// Method to decrement quantity
menuItemSchema.methods.decrementQuantity = async function (amount = 1) {
    if (this.availableQuantity < amount) {
        throw new Error('Insufficient quantity available');
    }
    this.availableQuantity -= amount;
    if (this.availableQuantity === 0) {
        this.isAvailable = false;
    }
    return this.save();
};

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;

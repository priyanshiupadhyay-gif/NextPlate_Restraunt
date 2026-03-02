/**
 * Quick Fix: Approve All Pending Menu Items
 * 
 * Run this ONCE to approve items that were added before the auto-approve change.
 * Usage: node scripts/approve-all-items.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MenuItem = require('../src/models/MenuItem');

const approveAll = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📡 Connected to MongoDB...');

        // Find all unapproved items
        const pendingCount = await MenuItem.countDocuments({ isApproved: false });
        console.log(`📋 Found ${pendingCount} unapproved menu items`);

        if (pendingCount === 0) {
            console.log('✅ All items are already approved!');
            process.exit(0);
        }

        // Approve all pending items
        const result = await MenuItem.updateMany(
            { isApproved: false },
            { $set: { isApproved: true } }
        );

        console.log(`✅ Approved ${result.modifiedCount} menu items!`);
        console.log('🎉 All items are now visible to users and NGOs.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

approveAll();

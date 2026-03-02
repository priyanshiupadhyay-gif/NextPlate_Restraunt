/**
 * Admin Seed Script
 * Creates an initial admin user in the database
 * 
 * Usage: node scripts/seed-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@nextplate.com';
const ADMIN_PASSWORD = 'NextPlate@2024';
const ADMIN_NAME = 'Platform Admin';

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'restaurant', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function seedAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

        if (existingAdmin) {
            console.log('ℹ️  Admin user already exists');
            console.log(`   Email: ${ADMIN_EMAIL}`);
        } else {
            // Hash password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

            // Create admin
            const admin = await User.create({
                fullName: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
            });

            console.log('✅ Admin user created successfully!');
            console.log(`   ID: ${admin._id}`);
            console.log(`   Email: ${ADMIN_EMAIL}`);
            console.log(`   Password: ${ADMIN_PASSWORD}`);
        }

        console.log('\n🔐 Admin Credentials:');
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

seedAdmin();

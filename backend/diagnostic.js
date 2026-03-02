const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const diagnostic = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📡 Connected to MongoDB');

        const admin = await User.findOne({ email: 'admin@nextplate.com' });

        if (!admin) {
            console.log('❌ Admin user admin@nextplate.com NOT FOUND');
        } else {
            console.log('✅ Admin user FOUND');
            console.log('Role:', admin.role);
            console.log('Full Name:', admin.fullName);
            console.log('Password hash present?', !!admin.password);
        }

        const admins = await User.find({ role: 'admin' });
        console.log(`Total users with role 'admin': ${admins.length}`);
        admins.forEach(a => console.log(` - ${a.email} (${a.fullName})`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        process.exit(1);
    }
};

diagnostic();

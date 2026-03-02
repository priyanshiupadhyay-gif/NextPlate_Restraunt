const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAll() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const User = require('./src/models/User');
        const Restaurant = require('./src/models/Restaurant');
        const MenuItem = require('./src/models/MenuItem');

        const usersCount = await User.countDocuments();
        const restaurantsCount = await Restaurant.countDocuments();
        const menuItemsCount = await MenuItem.countDocuments();

        console.log(`Users: ${usersCount}`);
        console.log(`Restaurants: ${restaurantsCount}`);
        console.log(`MenuItems: ${menuItemsCount}`);

        const users = await User.find().limit(10);
        users.forEach(u => console.log(`User: ${u.fullName} (${u.email}), Role: ${u.role}, VerifiedNGO: ${u.isVerifiedNGO}`));

        const rests = await Restaurant.find().limit(10);
        rests.forEach(r => console.log(`Rest: ${r.name}, Verified: ${r.isVerified}`));

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkAll();

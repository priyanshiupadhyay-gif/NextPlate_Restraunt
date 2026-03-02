const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkOrders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const Order = require('./src/models/Order');
        const User = require('./src/models/User');

        const orders = await Order.find().sort({ createdAt: -1 }).limit(5);
        console.log(`Found ${orders.length} orders`);

        orders.forEach(o => {
            console.log(`Order: ${o.orderNumber}, Status: ${o.orderStatus}, Total: ${o.totalAmount}, Customer: ${o.customerId}`);
        });

        const users = await User.find({ role: 'ngo' });
        console.log(`Found ${users.length} NGOs`);
        users.forEach(u => console.log(`NGO: ${u.fullName}, Verified: ${u.isVerifiedNGO}`));

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkOrders();

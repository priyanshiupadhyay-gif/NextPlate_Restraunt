
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MenuItem = require('./src/models/MenuItem');
require('./src/models/Restaurant'); // Register model
const Restaurant = require('./src/models/Restaurant');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete all items that ARE NOT USA-Data
        const deleteResult = await MenuItem.deleteMany({
            tags: { $ne: 'USA-Data' }
        });
        console.log(`Deleted ${deleteResult.deletedCount} non-USA menu items.`);

        // Delete test/simulator restaurants
        const restNames = ['Seed Node (Simulator)', 'Temflo Systems Pvt. Ltd', 'werty'];
        const restDeleteResult = await Restaurant.deleteMany({
            name: { $in: restNames }
        });
        console.log(`Deleted ${restDeleteResult.deletedCount} test/simulator restaurants.`);

        // Ensure the 5 USA restaurants are active
        const usaRestIds = [
            '69a52819be3d228ad1342d77', // Global Bites
            '69a5311dbe3d228ad1342f85', // Palm Royal
            '69a537f27d14656fb3dca659', // Fresh Roots Kitchen
            '69a54549be3d228ad13434ae', // HomeTown Rescue
            '69a5486b0a1b15f92596e330'  // Nourish & Share
        ];

        for (const id of usaRestIds) {
            await Restaurant.findByIdAndUpdate(id, { isActive: true, isVerified: true });
        }
        console.log('Verified status for USA restaurants.');

        console.log('Cleanup completed successfully.');
    } catch (error) {
        console.error('Cleanup error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

cleanup();

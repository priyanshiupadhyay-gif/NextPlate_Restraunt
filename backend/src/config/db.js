const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        const options = {
            maxPoolSize: 100, // Highly scalable pool
            minPoolSize: 10,  // Keep some warm connections
            socketTimeoutMS: 45000,
            family: 4 // Use IPv4, skip trying IPv6
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        logger.info(`📡 MongoDB Grid Synchronized: ${conn.connection.host}`);

        // Scale Monitoring
        mongoose.connection.on('error', (err) => {
            logger.error(`❌ Database Link Error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ Database Link Severed. Reconnecting...');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('🔄 Database Link Re-established.');
        });

    } catch (error) {
        logger.error(`❌ Critical Database Fault: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;

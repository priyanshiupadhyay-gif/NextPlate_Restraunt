const QRCode = require('qrcode');
const crypto = require('crypto');
const logger = require('../utils/logger');

// @desc    Generate QR code for an order
// @param   {object} orderData - Order data to encode
// @returns {Promise<{qrImage: string, qrData: string}>}
exports.generateQRCode = async (orderData) => {
    try {
        const { orderId, orderNumber, customerId, restaurantId } = orderData;

        const data = {
            orderId: orderId.toString(),
            orderNumber,
            customerId: customerId.toString(),
            restaurantId: restaurantId.toString(),
            timestamp: new Date().toISOString()
        };

        // Generate checksum for security
        const checksum = crypto
            .createHash('sha256')
            .update(JSON.stringify(data) + process.env.JWT_ACCESS_SECRET)
            .digest('hex')
            .substring(0, 16);

        data.checksum = checksum;
        const qrData = JSON.stringify(data);

        // Generate QR code as data URL
        const qrImage = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 256,
            color: {
                dark: '#1A472A', // NextPlate green
                light: '#FFFFFF'
            }
        });

        logger.info(`QR code generated for order: ${orderNumber}`);

        return { qrImage, qrData };
    } catch (error) {
        logger.error('QR generation error:', error);
        throw error;
    }
};

// @desc    Validate QR code data
// @param   {string} qrData - QR data string to validate
// @returns {object} { isValid: boolean, data?: object, error?: string }
exports.validateQRCode = (qrData) => {
    try {
        const data = JSON.parse(qrData);
        const { checksum, ...rest } = data;

        // Verify checksum
        const expectedChecksum = crypto
            .createHash('sha256')
            .update(JSON.stringify(rest) + process.env.JWT_ACCESS_SECRET)
            .digest('hex')
            .substring(0, 16);

        if (checksum !== expectedChecksum) {
            return {
                isValid: false,
                error: 'Invalid QR code signature'
            };
        }

        // Check if QR code is expired (30 minutes)
        const timestamp = new Date(data.timestamp);
        const now = new Date();
        const diffMinutes = (now - timestamp) / (1000 * 60);

        if (diffMinutes > 30) {
            return {
                isValid: false,
                error: 'QR code has expired'
            };
        }

        return {
            isValid: true,
            data: rest
        };
    } catch (error) {
        return {
            isValid: false,
            error: 'Invalid QR code format'
        };
    }
};

// @desc    Generate QR code as buffer (for file download)
// @param   {string} data - Data to encode
// @returns {Promise<Buffer>}
exports.generateQRBuffer = async (data) => {
    try {
        return await QRCode.toBuffer(data, {
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 256
        });
    } catch (error) {
        logger.error('QR buffer generation error:', error);
        throw error;
    }
};

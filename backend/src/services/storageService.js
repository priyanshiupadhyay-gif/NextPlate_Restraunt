const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_API_SECRET !== 'your_cloudinary_api_secret_here'
    );
};

// Check if MongoDB storage is enabled (fallback)
const isMongoStorageEnabled = () => {
    return process.env.USE_MONGODB_STORAGE === 'true';
};

// Local disk storage fallback
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Common file filter
const fileFilter = (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const isSupported = allowedTypes.test(path.extname(file.originalname).toLowerCase()) ||
        allowedTypes.test(file.mimetype);

    if (isSupported) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP and PDF are allowed.'));
    }
};

/**
 * Configure multer — uses Cloudinary if configured, otherwise MongoDB (memory) or local filesystem
 * @param {string} folder - Destination folder (for organization)
 */
const upload = (folder = 'general') => {
    // 1. Cloudinary Storage (Highest Priority)
    if (isCloudinaryConfigured()) {
        const storage = new CloudinaryStorage({
            cloudinary: cloudinary,
            params: {
                folder: `rescue-ai/${folder}`,
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
                public_id: (_req, file) => `${uuidv4()}-${path.parse(file.originalname).name}`,
            },
        });

        return multer({
            storage: storage,
            fileFilter,
            limits: { fileSize: 5 * 1024 * 1024 },
        });
    }

    // 2. MongoDB Storage fallback
    if (isMongoStorageEnabled()) {
        return multer({
            storage: multer.memoryStorage(),
            fileFilter,
            limits: { fileSize: 5 * 1024 * 1024 },
        });
    }

    // 3. Local Storage Fallback
    const dynamicLocalStorage = multer.diskStorage({
        destination: (_req, _file, cb) => {
            const dest = path.join(uploadsDir, folder);
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            cb(null, dest);
        },
        filename: (_req, file, cb) => {
            const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
            cb(null, fileName);
        },
    });

    return multer({
        storage: dynamicLocalStorage,
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    });
};

module.exports = {
    upload,
    cloudinary,
    isCloudinaryConfigured,
    isMongoStorageEnabled
};

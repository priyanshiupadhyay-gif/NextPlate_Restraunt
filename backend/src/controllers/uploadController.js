const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { isCloudinaryConfigured, isMongoStorageEnabled } = require('../services/storageService');
const Image = require('../models/Image');

const uploadImage = catchAsync(async (req, res) => {
    if (!req.file) {
        return res.status(httpStatus.BAD_REQUEST).send({
            success: false,
            message: 'No file uploaded',
        });
    }

    let imageUrl;
    let imageKey;

    if (isCloudinaryConfigured()) {
        // Cloudinary upload — multer-storage-cloudinary adds .path or .secure_url
        imageUrl = req.file.path || req.file.secure_url;
        imageKey = req.file.filename; // Cloudinary public_id
    } else if (isMongoStorageEnabled()) {
        // MongoDB Storage — req.file.buffer contains the file data
        const newImage = await Image.create({
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            data: req.file.buffer,
            size: req.file.size,
            folder: req.body.folder || 'general'
        });

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        imageUrl = `${baseUrl}/api/v1/upload/image/${newImage._id}`;
        imageKey = newImage._id.toString();
    } else {
        // Local filesystem fallback — serve from /uploads/
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        // Correct path: extract the folder after 'uploads'
        // multer's 'path' on Windows uses backslashes, so we normalize to forward slashes for URLs
        const relativePath = req.file.path.split('uploads')[1].replace(/\\/g, '/');
        imageUrl = `${baseUrl}/uploads${relativePath}`;
        imageKey = req.file.filename;
    }

    res.status(httpStatus.OK).send({
        success: true,
        data: {
            url: imageUrl,
            key: imageKey,
        },
    });
});

const getImage = catchAsync(async (req, res) => {
    const image = await Image.findById(req.params.id);

    if (!image) {
        return res.status(httpStatus.NOT_FOUND).send({
            success: false,
            message: 'Image not found',
        });
    }

    res.set('Content-Type', image.contentType);
    res.send(image.data);
});

module.exports = {
    uploadImage,
    getImage,
};

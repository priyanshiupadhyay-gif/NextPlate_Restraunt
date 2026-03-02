const express = require('express');
const multer = require('multer');
const { upload } = require('../services/storageService');
const { uploadImage, getImage } = require('../controllers/uploadController');

const router = express.Router();

// Multer error handler wrapper
const handleUpload = (folder, fieldName) => {
    return (req, res, next) => {
        const multerUpload = upload(folder).single(fieldName);
        multerUpload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer-specific error (file too large, etc.)
                return res.status(400).json({
                    success: false,
                    message: err.code === 'LIMIT_FILE_SIZE'
                        ? 'File is too large. Maximum size is 5MB.'
                        : `Upload error: ${err.message}`
                });
            } else if (err) {
                // Other errors (invalid file type, etc.)
                return res.status(400).json({
                    success: false,
                    message: err.message || 'File upload failed'
                });
            }
            next();
        });
    };
};

// Upload an Image (Optimized for MongoDB/R2)
// Route: POST /api/upload/image
router.post('/image', handleUpload('restaurant-images', 'image'), uploadImage);

// Get an Image from MongoDB (if used)
// Route: GET /api/upload/image/:id
router.get('/image/:id', getImage);

// Upload a document (Fallback/General)
// Route: POST /api/upload/doc
router.post('/doc', handleUpload('documents', 'file'), uploadImage);

module.exports = router;

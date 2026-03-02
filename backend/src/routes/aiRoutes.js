const express = require('express');
const router = express.Router();
const multer = require('multer');
const aiController = require('../controllers/aiController');
const { protect } = require('../middlewares/auth');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Public AI endpoints
router.get('/rescue-strategy', aiController.getRescueStrategy);
router.post('/meal-plan', aiController.getMealPlan);
router.get('/status', aiController.getAIStatus);
router.get('/stitch-insights', aiController.getStitchInsights);
router.post('/sponsor-meal', protect, aiController.sponsorMeal);
router.get('/sponsored-orders', protect, aiController.getSponsoredOrders);
router.post('/dispatch-order/:id', protect, aiController.dispatchOrder);

// Stitch Vision
router.post('/analyze-image', protect, upload.single('image'), aiController.analyzeImage);

module.exports = router;

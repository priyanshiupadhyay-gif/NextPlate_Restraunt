const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationController');
const { protect } = require('../middlewares/auth');

// GET /api/v1/recommendations — AI-powered personalized food recommendations
router.get('/', protect, getRecommendations);

module.exports = router;

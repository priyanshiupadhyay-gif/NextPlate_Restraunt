const express = require('express');
const router = express.Router();
const { getLatestSummary, getUserDailySummary } = require('../services/dailySummaryService');
const { protect } = require('../middlewares/auth');

// GET /api/v1/daily-summary — Get global daily impact summary (public)
router.get('/', getLatestSummary);

// GET /api/v1/daily-summary/me — Get user-specific daily impact + global summary
router.get('/me', protect, getUserDailySummary);

module.exports = router;

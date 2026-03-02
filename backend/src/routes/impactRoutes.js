const express = require('express');
const router = express.Router();
const impactController = require('../controllers/impactController');

// Global public stats
router.get('/stats', impactController.getGlobalImpact);

// Map nodes
router.get('/nodes', impactController.getNetworkNodes);

// Recent activity ticker
router.get('/recent-rescues', impactController.getRecentRescues);
router.get('/community', impactController.getCommunityImpact);

// Donation candidates (NGO view)
router.get('/donations', impactController.getDonationItems);

// Leaderboard
router.get('/leaderboard', impactController.getLeaderboard);

// Simulate activity (demo)
router.post('/simulate', impactController.simulateActivity);
router.post('/simulate-single', impactController.simulateSingleActivity);

module.exports = router;

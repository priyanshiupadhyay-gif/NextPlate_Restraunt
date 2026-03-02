const express = require('express');
const router = express.Router();
const ngoController = require('../controllers/ngoController');
const protect = require('../middlewares/auth');
const { authorize } = protect;

// All NGO routes require authentication and specific role
router.use(protect);
router.use(authorize('ngo'));

router.get('/route-optimizer', ngoController.getRescueRoute);
router.get('/hub-metrics', ngoController.getHubMetrics);

module.exports = router;

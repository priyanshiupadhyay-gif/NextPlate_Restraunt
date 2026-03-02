const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/csr', reportController.generateCSRReport);
router.get('/my-impact', reportController.getMyImpactReport);

module.exports = router;

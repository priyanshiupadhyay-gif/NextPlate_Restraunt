const express = require('express');
const router = express.Router();
const multer = require('multer');
const rescueAuditController = require('../controllers/rescueAuditController');
const { protect } = require('../middlewares/auth');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB for photos
});

router.use(protect);

router.post('/:orderId', upload.single('photo'), rescueAuditController.submitAudit);
router.get('/:orderId', rescueAuditController.getAudit);

module.exports = router;

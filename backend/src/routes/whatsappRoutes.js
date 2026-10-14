const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

router.post('/send-batch', whatsappController.sendBatch);
router.get('/history', whatsappController.getHistory);
router.get('/preview', whatsappController.previewBatch);

module.exports = router;

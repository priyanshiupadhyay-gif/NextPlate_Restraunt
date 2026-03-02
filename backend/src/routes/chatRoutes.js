const express = require('express');
const router = express.Router();
const { chat, getChatHistory, clearChatHistory } = require('../controllers/chatController');
const auth = require('../middlewares/auth');

// POST /api/chat — Send a message to Stitch AI
router.post('/', auth, chat);

// GET /api/chat/history — Get conversation history
router.get('/history', auth, getChatHistory);

// DELETE /api/chat/history — Clear history
router.delete('/history', auth, clearChatHistory);

module.exports = router;

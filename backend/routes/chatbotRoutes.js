// backend/routes/chatbotRoutes.js
const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

router.post('/chat', chatbotController.handleChatMessage);
router.post('/init', chatbotController.initSession);
router.get('/status', chatbotController.getStatus);
router.get('/suggestions', chatbotController.getSuggestions);

module.exports = router;

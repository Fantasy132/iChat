const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// 应用身份验证中间件到所有路由
router.use(authMiddleware);

// 获取聊天记录（历史消息）
router.get('/messages/history/:receiverId', messageController.getChatHistory);

// 获取私聊会话列表
router.get('/messages/sessions', messageController.getPrivateChatSessions);

module.exports = router;
const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/authMiddleware');

// 获取用户列表
router.get('/users', authMiddleware, friendController.getUsers);

// 发送好友请求
router.post('/friends/requests', authMiddleware, friendController.sendFriendRequest);

// 获取好友请求
router.get('/friends/requests', authMiddleware, friendController.getFriendRequests);

// 处理好友请求
router.put('/friends/requests/:id', authMiddleware, friendController.handleFriendRequest);

// 获取好友列表
router.get('/friends', authMiddleware, friendController.getFriends);

module.exports = router;
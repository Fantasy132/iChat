const Message = require('../models/Message');
const User = require('../models/User');
const { Op } = require('sequelize');

// 发送消息（配合Socket.io使用）
exports.sendMessage = async (io, senderId, receiverId, content) => {
    try {
        // 保存消息到数据库
        const message = await Message.create({
            sender_id: senderId,
            receiver_id: receiverId,
            content,
        });

        // 关联发送者信息
        const sender = await User.findByPk(senderId);
        message.sender = sender;

        // 广播消息给"接收者"和"发送者"的专属房间
        io.to(`user:${receiverId}`).to(`user:${senderId}`).emit('receive_message', {
            id: message.id,
            sender: {
                id: sender.id,
                username: sender.username,
                display_name: sender.display_name
            },
            receiver_id: receiverId,
            content: message.content,
            timestamp: message.timestamp,
        });

        return message;
    } catch (error) {
        console.error('发送消息失败:', error);
        throw error;
    }
};

// 获取聊天记录（历史消息）
exports.getChatHistory = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const senderId = req.user.id;

        let whereClause;
        if (receiverId === 'null' || receiverId === null) {
            // 公共聊天室消息
            whereClause = {
                receiver_id: null
            };
        } else {
            // 私聊消息
            whereClause = {
                [Op.or]: [
                    { sender_id: senderId, receiver_id: receiverId },
                    { sender_id: receiverId, receiver_id: senderId },
                ],
            };
        }

        // 查询聊天记录
        const messages = await Message.findAll({
            where: whereClause,
            order: [['timestamp', 'ASC']], // 按时间升序排列
            include: [
                { model: User, as: 'sender', attributes: ['id', 'username', 'display_name'] },
            ],
        });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};

// 获取私聊会话列表（与当前用户有过私聊的所有用户）
exports.getPrivateChatSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 查找与当前用户有关的所有私聊消息（作为发送者或接收者）
        const messages = await Message.findAll({
            where: {
                [Op.and]: [
                    {
                        receiver_id: {
                            [Op.ne]: null
                        }
                    },
                    {
                        [Op.or]: [
                            { sender_id: userId },
                            { receiver_id: userId }
                        ]
                    }
                ]
            },
            attributes: ['sender_id', 'receiver_id'],
            include: [
                { 
                    model: User, 
                    as: 'sender', 
                    attributes: ['id', 'username', 'display_name'] 
                },
                { 
                    model: User, 
                    as: 'receiver', 
                    attributes: ['id', 'username', 'display_name'] 
                }
            ]
        });
        
        // 提取所有与当前用户私聊过的用户
        const chatPartners = new Map();
        
        messages.forEach(msg => {
            // 如果当前用户是发送者，添加接收者
            if (msg.sender_id === userId && msg.receiver) {
                chatPartners.set(msg.receiver.id, msg.receiver);
            }
            // 如果当前用户是接收者，添加发送者
            else if (msg.receiver_id === userId && msg.sender) {
                chatPartners.set(msg.sender.id, msg.sender);
            }
        });
        
        // 转换为数组并返回
        const sessions = Array.from(chatPartners.values());
        res.json(sessions);
    } catch (error) {
        console.error('获取私聊会话列表失败:', error);
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};
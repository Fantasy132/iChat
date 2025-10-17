const User = require('../models/User');
const Friend = require('../models/Friend');
const FriendRequest = require('../models/FriendRequest');

// 获取用户列表（支持搜索）
exports.getUsers = async (req, res) => {
    try {
        const { search } = req.query;
        const whereClause = {
            id: {
                [require('sequelize').Op.ne]: req.user.id
            }
        };

        if (search) {
            whereClause[require('sequelize').Op.or] = [
                { username: { [require('sequelize').Op.like]: `%${search}%` } },
                { display_name: { [require('sequelize').Op.like]: `%${search}%` } }
            ];
        }

        const users = await User.findAll({
            where: whereClause,
            attributes: ['id', 'username', 'display_name', 'status']
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};

// 发送好友请求
exports.sendFriendRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.user.id;

        // 检查是否是自己
        if (currentUserId === targetUserId) {
            return res.status(400).json({ message: '不能添加自己为好友' });
        }

        // 检查用户是否存在
        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: '目标用户不存在' });
        }

        // 检查是否已经是好友
        const existingFriend = await Friend.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    {
                        user_id: currentUserId,
                        friend_id: targetUserId
                    },
                    {
                        user_id: targetUserId,
                        friend_id: currentUserId
                    }
                ]
            }
        });

        if (existingFriend) {
            return res.status(400).json({ message: '你们已经是好友了' });
        }

        // 检查是否已经发送过请求
        const existingRequest = await FriendRequest.findOne({
            where: {
                sender_id: currentUserId,
                receiver_id: targetUserId
            }
        });

        if (existingRequest) {
            return res.status(400).json({ message: '好友请求已发送，请等待对方确认' });
        }

        // 创建好友请求
        const friendRequest = await FriendRequest.create({
            sender_id: currentUserId,
            receiver_id: targetUserId
        });

        res.status(201).json({
            message: '好友请求发送成功',
            request: friendRequest
        });
    } catch (error) {
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};

// 获取好友请求
exports.getFriendRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.findAll({
            where: {
                receiver_id: req.user.id,
                status: 'pending'
            },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'username', 'display_name']
                }
            ]
        });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};

// 处理好友请求
exports.handleFriendRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'accepted' 或 'rejected'
        const currentUserId = req.user.id;

        // 查找好友请求
        const friendRequest = await FriendRequest.findByPk(id);
        if (!friendRequest) {
            return res.status(404).json({ message: '好友请求不存在' });
        }

        // 检查是否有权限处理该请求
        if (friendRequest.receiver_id !== currentUserId) {
            return res.status(403).json({ message: '无权限处理该请求' });
        }

        // 更新请求状态
        friendRequest.status = status;
        await friendRequest.save();

        // 如果接受请求，则创建好友关系
        if (status === 'accepted') {
            await Friend.create({
                user_id: friendRequest.sender_id,
                friend_id: friendRequest.receiver_id,
                status: 'accepted'
            });

            await Friend.create({
                user_id: friendRequest.receiver_id,
                friend_id: friendRequest.sender_id,
                status: 'accepted'
            });
        }

        res.json({
            message: `好友请求已${status === 'accepted' ? '接受' : '拒绝'}`,
            request: friendRequest
        });
    } catch (error) {
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};

// 获取好友列表
exports.getFriends = async (req, res) => {
    try {
        const friends = await Friend.findAll({
            where: {
                user_id: req.user.id,
                status: 'accepted'
            },
            include: [
                {
                    model: User,
                    as: 'friend',
                    attributes: ['id', 'username', 'display_name', 'status']
                }
            ]
        });

        // 只返回好友信息
        const friendList = friends.map(friend => ({
            id: friend.friend.id,
            username: friend.friend.username,
            display_name: friend.friend.display_name,
            status: friend.friend.status
        }));

        res.json(friendList);
    } catch (error) {
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};
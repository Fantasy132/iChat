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
        const currentUserId = req.user.id;
        const { targetUserId } = req.body;

        // 不能添加自己为好友
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
                receiver_id: targetUserId,
                status: 'pending'
            }
        });

        if (existingRequest) {
            return res.status(400).json({ message: '好友请求已发送，请等待对方处理' });
        }

        // 创建好友请求
        const friendRequest = await FriendRequest.create({
            sender_id: currentUserId,
            receiver_id: targetUserId,
            status: 'pending'
        });

        // 获取发送者信息
        const sender = await User.findByPk(currentUserId);

        res.status(201).json({
            message: '好友请求发送成功',
            request: {
                ...friendRequest.toJSON(),
                senderUser: sender
            }
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
                    as: 'senderUser',
                    attributes: ['id', 'username', 'display_name']
                }
            ]
        });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};

// 获取已发送的好友请求
exports.getSentFriendRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.findAll({
            where: {
                sender_id: req.user.id,
                status: 'pending'
            },
            include: [
                {
                    model: User,
                    as: 'receiverUser',
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
        const { status } = req.body;
        const currentUserId = req.user.id;

        // 查找好友请求
        const friendRequest = await FriendRequest.findByPk(id);
        if (!friendRequest) {
            return res.status(404).json({ message: '好友请求不存在' });
        }

        // 检查是否有权限处理该请求
        if (friendRequest.receiver_id !== currentUserId) {
            return res.status(403).json({ message: '无权限处理该好友请求' });
        }

        // 更新好友请求状态
        friendRequest.status = status;
        await friendRequest.save();

        // 如果接受请求，创建好友关系
        if (status === 'accepted') {
            // 创建双向好友关系
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
            include: [{
                model: User,
                as: 'friendUser',
                attributes: ['id', 'username', 'display_name', 'status'],
                required: true
            }]
        });

        // 只返回好友信息
        const friendList = friends.map(friend => ({
            id: friend.friendUser.id,
            username: friend.friendUser.username,
            display_name: friend.friendUser.display_name,
            status: friend.friendUser.status
        }));

        res.json(friendList);
    } catch (error) {
        console.error('获取好友列表失败:', error);
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};

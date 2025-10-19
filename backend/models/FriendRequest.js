const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

// 定义FriendRequest模型，对应friend_requests表
const FriendRequest = sequelize.define('FriendRequest', {
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending',
    },
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});

// 建立关联：好友请求涉及发送者和接收者两个用户
FriendRequest.belongsTo(User, { as: 'senderUser', foreignKey: 'sender_id' });
FriendRequest.belongsTo(User, { as: 'receiverUser', foreignKey: 'receiver_id' });

module.exports = FriendRequest;
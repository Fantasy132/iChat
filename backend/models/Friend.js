const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

// 定义Friend模型，对应friends表
const Friend = sequelize.define('Friend', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    friend_id: {
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

// 建立关联：好友关系涉及两个用户
Friend.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
Friend.belongsTo(User, { as: 'friendUser', foreignKey: 'friend_id' });

module.exports = Friend;
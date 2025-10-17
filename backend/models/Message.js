const { DataTypes, Op } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

// 定义Message模型，对应messages表
const Message = sequelize.define('Message', {
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
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    timestamps: true,
    createdAt: 'timestamp', // 自定义时间字段名
    updatedAt: false,
});

// 建立关联：消息属于"发送者"和"接收者"
Message.belongsTo(User, { as: 'sender', foreignKey: 'sender_id' });
Message.belongsTo(User, { as: 'receiver', foreignKey: 'receiver_id' });

module.exports = Message;
module.exports.Op = Op; // 导出操作符，用于复杂查询
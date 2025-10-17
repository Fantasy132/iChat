const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const bcrypt = require('bcryptjs');

// 定义User模型，对应users表
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false, // 不允许为空
        unique: true,    // 用户名唯一
    },
    display_name: {
        type: DataTypes.STRING,
        allowNull: true, // 显示名称可以为空
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('online', 'offline'), // 状态：在线/离线
        defaultValue: 'offline',
    },
}, {
    timestamps: true,
    createdAt: 'created_at', // 自定义创建时间字段名
    updatedAt: false,        // 不需要更新时间
});

// 【重要】创建用户前，对密码进行哈希加密
User.beforeCreate(async (user) => {
    if (user.password_hash) {
        const salt = await bcrypt.genSalt(10); // 生成盐值
        user.password_hash = await bcrypt.hash(user.password_hash, salt); // 哈希密码
    }
    
    // 如果没有提供显示名称，则使用用户名
    if (!user.display_name) {
        user.display_name = user.username;
    }
});

// 更新用户前，确保显示名称存在
User.beforeUpdate(async (user) => {
    if (!user.display_name) {
        user.display_name = user.username;
    }
});

module.exports = User;
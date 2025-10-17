const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// 生成JWT Token（有效期24小时）
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// 注册用户
exports.register = async (req, res) => {
    try {
        const { username, displayName, password } = req.body;

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: '用户名已存在' });
        }

        // 创建用户（密码会被自动哈希）
        const user = await User.create({
            username,
            display_name: displayName || username, // 如果没有提供显示名称，则使用用户名
            password_hash: password,
        });

        // 生成Token
        const token = generateToken(user.id);

        res.status(201).json({
            message: '注册成功',
            user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                status: user.status,
            },
            token,
        });
    } catch (error) {
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};

// 用户登录
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 查找用户
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        // 验证密码（哈希对比）
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        // 更新用户状态为"在线"
        await user.update({ status: 'online' });

        // 生成Token
        const token = generateToken(user.id);

        res.json({
            message: '登录成功',
            user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                status: user.status,
            },
            token,
        });
    } catch (error) {
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};

// 获取当前用户信息（需认证）
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }
        res.json({
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            status: user.status,
        });
    } catch (error) {
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
};
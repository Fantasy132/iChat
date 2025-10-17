const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证JWT Token的中间件
module.exports = async (req, res, next) => {
    try {
        // 从请求头中获取Token（格式：Bearer <token>）
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: '未授权，请提供Token' });
        }

        // 验证Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({ message: '用户不存在' });
        }

        // 将用户信息挂载到req上，后续接口可直接使用
        req.user = user;
        next(); // 继续执行后续中间件/路由
    } catch (error) {
        return res.status(401).json({ message: 'Token无效或已过期' });
    }
};
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sequelize = require('./db');
const User = require('./models/User');
const Message = require('./models/Message');
const Friend = require('./models/Friend');
const FriendRequest = require('./models/FriendRequest');
const authRoutes = require('./routes/authRoutes');
const friendRoutes = require('./routes/friendRoutes');
const messageRoutes = require('./routes/messageRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// 初始化Express和HTTP服务器
const app = express();
const server = http.createServer(app);

// 配置Socket.io（允许前端跨域）
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // 前端地址，部署时替换为实际地址
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// 中间件
app.use(cors());
app.use(express.json()); // 解析JSON请求体

// 路由挂载
app.use('/api/auth', authRoutes);
app.use('/api', friendRoutes);
app.use('/api', messageRoutes);

// 同步数据库模型（使用force: false以避免数据丢失，生产环境推荐使用迁移脚本）
sequelize.sync({ force: false })
    .then(() => {
        console.log(' 数据库模型同步成功');
    })
    .catch((error) => {
        console.error(' 数据库同步失败:', error);
    });

// Socket.io 连接认证
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('未提供Token'));
    }

    try {
        // 验证Token并挂载用户ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = { id: decoded.id };
        next();
    } catch (error) {
        next(new Error('Token无效'));
    }
});

// 监听 WebSocket 连接事件（前端连过来时触发）
io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`✅ 用户 ${userId} 连接成功！客户端ID：${socket.id}`);
    
    // 将用户加入其专属房间
    socket.join(`user:${userId}`);
    
    // 更新用户状态为"在线"
    try {
        const user = await User.findByPk(userId);
        await user.update({ status: 'online' });
        // 广播用户上线事件
        socket.broadcast.emit('user_status_changed', {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            status: 'online'
        });
    } catch (error) {
        console.error('更新用户状态失败:', error);
    }

    // 监听前端发送的 "send_message" 事件（前端发消息时触发）
    socket.on('send_message', async (frontData) => {
        try {
            // 保存消息到数据库
            const message = await Message.create({
                sender_id: userId,
                receiver_id: frontData.receiver_id || null, // 如果是公共聊天，接收者为空
                content: frontData.content,
            });

            // 获取发送者信息
            const sender = await User.findByPk(userId);

            // 构造消息对象
            const messageData = {
                id: message.id,
                sender: {
                    id: sender.id,
                    username: sender.username,
                    display_name: sender.display_name
                },
                receiver_id: frontData.receiver_id,
                content: message.content,
                timestamp: message.timestamp,
            };

            // 如果是私聊消息，只发送给指定用户和自己
            if (frontData.receiver_id) {
                // 发送给接收者（如果在线）
                io.to(`user:${frontData.receiver_id}`).emit('receive_message', messageData);
                // 发送给自己（确认消息发送成功）
                socket.emit('receive_message', messageData);
            } else {
                // 如果是公共聊天，广播给所有连接的客户端
                io.emit('receive_message', messageData);
            }
        } catch (error) {
            console.error('消息发送失败:', error);
            socket.emit('message_error', { message: '消息发送失败', error: error.message });
        }
    });

    // 监听前端断开连接事件
    socket.on('disconnect', async () => {
        console.log(`❌ 用户 ${userId} 断开连接！客户端ID：${socket.id}`);
        try {
            const user = await User.findByPk(userId);
            await user.update({ status: 'offline' });
            // 广播用户离线事件
            socket.broadcast.emit('user_status_changed', {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                status: 'offline'
            });
        } catch (error) {
            console.error('更新用户状态失败:', error);
        }
    });
});

// 启动服务器
const PORT = 3001;
server.listen(PORT, () => {
    console.log(` 后端websocket服务器运行在 http://localhost:${PORT}`);
});
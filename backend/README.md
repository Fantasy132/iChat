# iChat 后端开发说明文档

本文档旨在为后端开发人员提供清晰的功能需求和接口规范，以便实现与前端配合的完整聊天系统。

## 项目概述

iChat 是一个实时聊天应用，支持公共聊天室和私聊功能，以及好友系统。前端采用 React + Socket.IO 实现，后端需要提供相应的 REST API 和 WebSocket 支持。

## 技术栈要求

- Web框架：Express.js
- 实时通信：Socket.IO
- 数据库ORM：Sequelize
- 数据库：MySQL
- 身份验证：JWT (jsonwebtoken)
- 密码加密：bcryptjs
- 跨域处理：cors

## 功能模块

### 1. 用户认证系统

#### 1.1 用户注册
- **接口**：`POST /api/auth/register`
- **参数**：
  - `username` (string, required): 用户名
  - `password` (string, required): 密码
- **响应**：
  - 成功：返回用户信息和 JWT token
  - 失败：返回错误信息

#### 1.2 用户登录
- **接口**：`POST /api/auth/login`
- **参数**：
  - `username` (string, required): 用户名
  - `password` (string, required): 密码
- **响应**：
  - 成功：返回用户信息和 JWT token
  - 失败：返回错误信息

#### 1.3 获取当前用户信息
- **接口**：`GET /api/auth/me`
- **认证**：需要 JWT token
- **响应**：返回当前用户信息

### 2. 好友系统

#### 2.1 获取用户列表
- **接口**：`GET /api/users`
- **认证**：需要 JWT token
- **参数**：
  - `search` (string, optional): 搜索关键词
- **响应**：返回用户列表（排除当前用户）

#### 2.2 发送好友请求
- **接口**：`POST /api/friends/requests`
- **认证**：需要 JWT token
- **参数**：
  - `targetUserId` (integer, required): 目标用户ID
- **响应**：返回请求状态

#### 2.3 获取好友请求
- **接口**：`GET /api/friends/requests`
- **认证**：需要 JWT token
- **响应**：返回当前用户收到的好友请求列表

#### 2.4 处理好友请求
- **接口**：`PUT /api/friends/requests/:id`
- **认证**：需要 JWT token
- **参数**：
  - `status` (string, required): "accepted" 或 "rejected"
- **响应**：返回处理结果

#### 2.5 获取好友列表
- **接口**：`GET /api/friends`
- **认证**：需要 JWT token
- **响应**：返回好友列表（包含在线状态）

### 3. 消息系统

#### 3.1 发送消息（WebSocket）
- **事件**：`send_message`
- **参数**：
  - `content` (string, required): 消息内容
  - `receiver_id` (integer, optional): 接收者ID（私聊时需要，公共聊天室为null）
- **响应事件**：`receive_message`

#### 3.2 获取聊天历史
- **接口**：`GET /api/messages/history/:receiverId`
- **认证**：需要 JWT token
- **说明**：
  - 当 receiverId 为 "null" 时，获取公共聊天室历史消息
  - 当 receiverId 为好友ID时，获取私聊历史消息
- **响应**：返回聊天历史记录

### 4. 实时通信（WebSocket）

#### 4.1 连接认证
- 客户端连接时需要在 auth 字段提供 JWT token
- 服务端验证 token 并获取用户信息

#### 4.2 用户状态管理
- 用户连接时，更新状态为"online"并广播 `user_status_changed` 事件
- 用户断开连接时，更新状态为"offline"并广播 `user_status_changed` 事件

#### 4.3 消息广播
- 公共消息：广播给所有连接的客户端
- 私聊消息：发送给指定用户和发送者自己

## 数据库设计

### users 表
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `username` (STRING, UNIQUE)
- `password_hash` (STRING)
- `status` (ENUM: 'online', 'offline', DEFAULT: 'offline')
- `created_at` (TIMESTAMP)

### friends 表
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `user_id` (INTEGER, FOREIGN KEY to users.id)
- `friend_id` (INTEGER, FOREIGN KEY to users.id)
- `status` (ENUM: 'pending', 'accepted', 'rejected', DEFAULT: 'pending')
- `created_at` (TIMESTAMP)

### friend_requests 表
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `sender_id` (INTEGER, FOREIGN KEY to users.id)
- `receiver_id` (INTEGER, FOREIGN KEY to users.id)
- `status` (ENUM: 'pending', 'accepted', 'rejected', DEFAULT: 'pending')
- `created_at` (TIMESTAMP)

### messages 表
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `sender_id` (INTEGER, FOREIGN KEY to users.id)
- `receiver_id` (INTEGER, FOREIGN KEY to users.id, NULL for public messages)
- `content` (TEXT)
- `timestamp` (TIMESTAMP)

## Socket.IO 事件

### 客户端发送事件
1. `send_message`: 发送消息
2. `disconnect`: 用户断开连接

### 服务端发送事件
1. `receive_message`: 接收消息
2. `user_status_changed`: 用户状态变化
3. `message_error`: 消息发送错误

## 错误处理

所有 API 接口应返回统一的错误格式：
```json
{
  "message": "错误描述",
  "error": "详细错误信息（可选）"
}
```

HTTP 状态码：
- 200: 成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未认证
- 404: 资源不存在
- 500: 服务器内部错误

## 安全要求

1. 所有接口必须进行身份验证（除注册和登录接口）
2. 密码必须使用 bcryptjs 进行哈希存储
3. JWT token 有效期为24小时
4. 跨域请求需要正确配置 CORS
5. 敏感信息不能在日志中明文输出

## 部署要求

1. 环境变量配置：
   - `JWT_SECRET`: JWT 密钥
   - 数据库连接信息

2. 端口配置：
   - 默认监听端口: 3001

3. 数据库初始化：
   - 需要执行 ichat.sql 创建数据库表

## 运行说明

1. 确保 MySQL 数据库服务正在运行
2. 创建并配置 .env 文件，设置 JWT_SECRET
3. 执行 ichat.sql 脚本创建数据库和表
4. 安装依赖：`npm install`
5. 启动服务器：`node server.js`
6. 服务将在 http://localhost:3001 上运行
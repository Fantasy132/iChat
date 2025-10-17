## **项目技术栈说明文档**

### **项目名称：** 简易聊天应用

### **项目目标：**

开发一个简单的实时聊天应用，用户可以通过 WebSocket 与其他在线用户实时交流，应用会有基本的消息发送与接收功能。前端使用 React 框架开发，后端使用 Node.js 和 Socket.io，数据存储采用 MySQL 数据库。

------

### **技术栈概览：**

#### **前端技术栈：**

1. **框架：** React
   - 使用 React 构建聊天应用的用户界面。React 是一个非常流行的前端框架，支持组件化开发，能够高效地管理 UI 状态和更新。
2. **状态管理：**
   - **React (useState, useContext)：** 利用 React 内置的状态管理功能（如 `useState` 和 `useContext`）来管理聊天应用中的消息状态和用户状态（如在线、离线等）。
3. **WebSocket 客户端：**
   - **Socket.io-client：** 使用 `Socket.io-client` 库与后端进行 WebSocket 通信，实现消息的实时发送与接收。
4. **样式框架：**
   - **TailwindCSS：** 使用 TailwindCSS 快速实现响应式设计和定制化样式。Tailwind 是一个实用的 CSS 框架，它允许通过类名控制样式，能显著提升开发效率。
5. **构建工具：**
   - **Vite：** 用于快速构建 React 应用。Vite 提供快速的热更新和高效的构建速度，非常适合现代前端开发。

------

#### **后端技术栈：**

1. **语言：** Node.js
   - Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时，适用于构建高并发、高性能的实时应用。
2. **框架：** Express.js
   - Express.js 是一个简单灵活的 Web 应用框架，基于 Node.js，帮助我们快速构建 RESTful API 和处理 HTTP 请求。
3. **WebSocket 服务：**
   - **Socket.io：** 用于实现前后端的实时通信，能够高效地处理消息的发送与接收，支持连接、断开连接、消息广播等功能。
4. **数据库：** MySQL
   - **MySQL** 是一个开源的关系型数据库管理系统，用于存储聊天记录和用户信息。我们使用 MySQL 来保存聊天记录、用户的基本信息（如用户名、密码等）。
   - 使用 **Sequelize** 作为 ORM（对象关系映射）工具来与 MySQL 进行交互，简化数据库操作。
5. **用户认证：**
   - **JWT (JSON Web Token)：** 使用 JWT 实现用户的认证和授权功能，确保只有已登录的用户才能发送消息，并能够在多次请求中保持登录状态。

------

#### **数据库结构：**

1. **MySQL 数据库：**

   - **表设计：**
     - **users 表：** 存储用户信息（如用户名、密码哈希、用户状态等）。
     - **messages 表：** 存储聊天记录（如消息内容、发送者、接收者、时间戳等）。

2. **表结构设计：**

   - **users 表：**

     ```
     CREATE TABLE users (
       id INT AUTO_INCREMENT PRIMARY KEY,
       username VARCHAR(255) NOT NULL UNIQUE,
       password_hash VARCHAR(255) NOT NULL,
       status ENUM('online', 'offline') DEFAULT 'offline',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
     ```

   - **messages 表：**

     ```
     CREATE TABLE messages (
       id INT AUTO_INCREMENT PRIMARY KEY,
       sender_id INT,
       receiver_id INT,
       content TEXT,
       timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (sender_id) REFERENCES users(id),
       FOREIGN KEY (receiver_id) REFERENCES users(id)
     );
     ```

------

### **前端与后端交互：**

1. **WebSocket 事件：**
   - **客户端到服务器的消息：**
     - **`send_message`**：前端发送消息到服务器。
       - 数据格式：`{ sender_id, receiver_id, content }`
   - **服务器到客户端的消息：**
     - **`receive_message`**：服务器接收到消息并广播给所有在线用户。
       - 数据格式：`{ sender_id, receiver_id, content, timestamp }`
2. **用户认证：**
   - 客户端在登录时发送用户名和密码，服务器验证后返回一个 **JWT**，客户端存储该 **JWT** 并在后续请求中作为 Authorization 头部发送。

------

### **总结：**

该项目的技术栈选择了广泛使用且高效的技术来确保项目开发的高效性和可维护性：

- **前端：** React + Socket.io-client + TailwindCSS，用于实现高效的界面和实时消息传递。
- **后端：** Node.js + Express + Socket.io，用于实现实时通信和用户认证功能。
- **数据库：** MySQL，用于存储用户信息和聊天记录。
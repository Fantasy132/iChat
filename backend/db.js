const { Sequelize } = require('sequelize');

// 连接MySQL数据库
const sequelize = new Sequelize('ichat', 'root', '123456', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false, // 关闭SQL日志
});

// 测试数据库连接
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('数据库连接成功');
    } catch (error) {
        console.error('数据库连接失败:', error);
    }
}
testConnection();

module.exports = sequelize;
/**
 * 后端服务启动入口
 * 负责加载配置、创建应用并启动 HTTP 服务
 */

const { getEnvConfig } = require('./config/env');
const { createApp } = require('./app');
const { createLogger } = require('./utils/logger');
const { createDatabasePool } = require('./database/client');
const { initializeDatabase } = require('./database/initializer');

const logger = createLogger('api:server');

/**
 * 启动后端服务
 */
async function bootstrap() {
  try {
    // 第一步：加载环境配置
    const config = getEnvConfig();

    // 第二步：创建数据库连接池
    const databasePool = createDatabasePool(config);

    // 第三步：先初始化数据库结构和默认配置，再启动 HTTP 服务
    await initializeDatabase(databasePool);

    // 第四步：创建应用实例
    const app = createApp(config);

    // 将数据库连接池挂载到应用实例，方便后续模块复用
    app.locals.db = databasePool;

    // 第五步：启动监听服务
    app.listen(config.port, () => {
      logger.info(`${config.appName} 启动成功，监听端口 ${config.port}`);
    });
  } catch (error) {
    logger.error(`服务启动失败：${error.message}`);
    process.exit(1);
  }
}

bootstrap();

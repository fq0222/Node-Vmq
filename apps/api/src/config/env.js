/**
 * 环境配置模块
 * 统一加载并导出后端服务运行所需配置
 */

const path = require('path');
const dotenv = require('dotenv');
const { createLogger } = require('../utils/logger');

const logger = createLogger('api:config');

/**
 * 加载环境变量
 * 这里显式指定 .env 文件路径，便于后续维护
 */
dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

/**
 * 读取并整理环境配置
 * @returns {{
 *   nodeEnv: string,
 *   appName: string,
 *   port: number,
 *   sessionSecret: string,
 *   webOrigin: string,
 *   pgHost: string,
 *   pgPort: number,
 *   pgUser: string,
 *   pgPassword: string,
 *   pgDatabase: string,
 *   pgSslMode: string
 * }} 运行配置对象
 */
function getEnvConfig() {
  const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME || 'Node-Vmq API',
    port: Number(process.env.PORT || 3000),
    sessionSecret: process.env.SESSION_SECRET || 'node-vmq-dev-secret',
    webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5173',
    pgHost: process.env.PGHOST || '127.0.0.1',
    pgPort: Number(process.env.PGPORT || 5432),
    pgUser: process.env.PGUSER || 'postgres',
    pgPassword: process.env.PGPASSWORD || 'postgres',
    pgDatabase: process.env.PGDATABASE || 'node_vmq',
    pgSslMode: process.env.PGSSLMODE || 'disable'
  };

  // 关键配置加载完成后打印日志，便于排查启动问题
  logger.info(
    `环境配置加载完成，端口=${config.port}，环境=${config.nodeEnv}，数据库=${config.pgHost}:${config.pgPort}/${config.pgDatabase}`
  );

  return config;
}

module.exports = {
  getEnvConfig
};

/**
 * PostgreSQL 客户端模块
 * 统一管理数据库连接池和基础连接能力
 */

const { Pool } = require('pg');
const { createLogger } = require('../utils/logger');

const logger = createLogger('api:db:client');

/**
 * 根据环境配置创建 PostgreSQL 连接池
 * @param {{
 *   pgHost: string,
 *   pgPort: number,
 *   pgUser: string,
 *   pgPassword: string,
 *   pgDatabase: string,
 *   pgSslMode: string
 * }} config - 数据库配置
 * @returns {Pool} PostgreSQL 连接池
 */
function createDatabasePool(config) {
  // 在创建连接池时打印基础连接信息，方便开发阶段排查配置错误
  logger.info(`创建 PostgreSQL 连接池，地址=${config.pgHost}:${config.pgPort}，数据库=${config.pgDatabase}`);

  return new Pool({
    host: config.pgHost,
    port: config.pgPort,
    user: config.pgUser,
    password: config.pgPassword,
    database: config.pgDatabase,
    ssl: config.pgSslMode === 'require'
      ? {
          rejectUnauthorized: false
        }
      : false
  });
}

/**
 * 验证数据库连接是否可用
 * @param {Pool} pool - 数据库连接池
 * @returns {Promise<void>}
 */
async function verifyDatabaseConnection(pool) {
  const client = await pool.connect();

  try {
    logger.info('开始验证 PostgreSQL 连接');
    await client.query('select 1 as ok');
    logger.info('PostgreSQL 连接验证通过');
  } finally {
    client.release();
  }
}

module.exports = {
  createDatabasePool,
  verifyDatabaseConnection
};

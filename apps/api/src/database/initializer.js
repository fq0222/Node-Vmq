/**
 * 数据库初始化模块
 * 负责完成连接验证、迁移执行和默认配置落库
 */

const { createLogger } = require('../utils/logger');
const { verifyDatabaseConnection } = require('./client');
const { runMigrations } = require('./migrator');
const { createDefaultSettings } = require('./default-settings');

const logger = createLogger('api:db:init');

/**
 * 判断 settings 表是否为空
 * @param {import('pg').Pool} pool - 数据库连接池
 * @returns {Promise<boolean>} 是否为空
 */
async function isSettingsTableEmpty(pool) {
  const result = await pool.query('select count(*)::int as total from settings');
  return result.rows[0].total === 0;
}

/**
 * 写入默认系统配置
 * @param {import('pg').Pool} pool - 数据库连接池
 * @returns {Promise<void>}
 */
async function seedDefaultSettings(pool) {
  const settings = createDefaultSettings();
  const client = await pool.connect();

  try {
    await client.query('begin');

    // 逐项写入默认配置，便于后续扩展时保持清晰
    for (const item of settings) {
      await client.query(
        'insert into settings(key, value) values($1, $2) on conflict (key) do nothing',
        [item.key, item.value]
      );
    }

    await client.query('commit');
    logger.info(`默认系统配置写入完成，共 ${settings.length} 项`);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 执行数据库初始化流程
 * @param {import('pg').Pool} pool - 数据库连接池
 * @returns {Promise<void>}
 */
async function initializeDatabase(pool) {
  logger.info('开始执行数据库初始化流程');

  await verifyDatabaseConnection(pool);
  await runMigrations(pool);

  const empty = await isSettingsTableEmpty(pool);

  // 只有配置表为空时才写入默认配置，保持与原系统一致
  if (empty) {
    logger.info('检测到 settings 表为空，开始写入默认配置');
    await seedDefaultSettings(pool);
  } else {
    logger.info('settings 表已有数据，跳过默认配置初始化');
  }

  logger.info('数据库初始化流程执行完成');
}

module.exports = {
  initializeDatabase
};

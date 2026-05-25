/**
 * 系统配置仓储模块
 * 统一封装 settings 表读取逻辑，避免业务层直接拼接 SQL
 */

const { createLogger } = require('../utils/logger');

const logger = createLogger('api:repo:settings');

/**
 * 创建系统配置仓储
 * @param {import('pg').Pool} pool - 数据库连接池
 * @returns {{getSettingValue: (key: string) => Promise<string|null>}} 系统配置仓储
 */
function createSettingsRepository(pool) {
  return {
    /**
     * 按键名读取配置值
     * @param {string} key - 配置键名
     * @returns {Promise<string|null>} 配置值
     */
    async getSettingValue(key) {
      logger.info(`开始读取系统配置，key=${key}`);

      const result = await pool.query(
        'select value from settings where key = $1 limit 1',
        [key]
      );

      if (result.rows.length === 0) {
        logger.warn(`未找到系统配置，key=${key}`);
        return null;
      }

      logger.info(`系统配置读取完成，key=${key}`);
      return result.rows[0].value;
    }
  };
}

module.exports = {
  createSettingsRepository
};

/**
 * 金额占位仓储模块
 * 统一封装 tmp_prices 表的占位与释放逻辑
 */

const { createLogger } = require('../utils/logger');

const logger = createLogger('api:repo:tmp-prices');

/**
 * 创建金额占位仓储
 * @param {{query: Function}} db - 数据库连接对象
 * @returns {{
 *   tryReservePriceKey: (priceKey: string, createdAt?: number) => Promise<boolean>,
 *   releasePriceKey: (priceKey: string) => Promise<void>
 * }} 金额占位仓储
 */
function createTmpPricesRepository(db) {
  return {
    async tryReservePriceKey(priceKey, createdAt = Date.now()) {
      logger.info(`开始尝试占用金额键，priceKey=${priceKey}`);

      try {
        await db.query(
          'insert into tmp_prices(price_key, created_at) values($1, $2)',
          [priceKey, createdAt]
        );
        logger.info(`金额键占用成功，priceKey=${priceKey}`);
        return true;
      } catch (error) {
        logger.warn(`金额键占用失败，priceKey=${priceKey}`);
        return false;
      }
    },

    async releasePriceKey(priceKey) {
      logger.info(`开始释放金额键占位，priceKey=${priceKey}`);
      await db.query('delete from tmp_prices where price_key = $1', [priceKey]);
      logger.info(`金额键占位释放完成，priceKey=${priceKey}`);
    }
  };
}

module.exports = {
  createTmpPricesRepository
};

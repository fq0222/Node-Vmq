/**
 * 固定金额二维码仓储模块
 * 统一封装 pay_qrcodes 表读写逻辑，避免业务层直接拼接 SQL
 */

const { createLogger } = require('../utils/logger');

const logger = createLogger('api:repo:pay-qrcode');

/**
 * 创建固定金额二维码仓储
 * @param {{query: Function}} db - 数据库连接对象
 * @returns {{
 *   createPayQrcode: (payload: {payUrl: string, price: number, type: number}) => Promise<void>,
 *   findByPriceAndType: (price: number, type: number) => Promise<Record<string, unknown>|null>,
 *   findPayQrcodes: (query: {page: number, limit: number, type: number|null}) => Promise<{count: number, rows: Array<Record<string, unknown>>}>,
 *   deletePayQrcodeById: (id: number) => Promise<void>
 * }} 固定金额二维码仓储
 */
function createPayQrcodeRepository(db) {
  return {
    async createPayQrcode(payload) {
      logger.info(`开始新增固定金额二维码，type=${payload.type}，price=${payload.price}`);

      await db.query(
        'insert into pay_qrcodes(pay_url, price, type) values($1, $2, $3)',
        [payload.payUrl, payload.price, payload.type]
      );

      logger.info('固定金额二维码新增完成');
    },

    async findByPriceAndType(price, type) {
      logger.info(`开始按金额和类型查询固定金额二维码，type=${type}，price=${price}`);
      const result = await db.query(
        `select
          id,
          pay_url as "payUrl",
          price,
          type
        from pay_qrcodes
        where type = $1 and price = $2
        order by id asc
        limit 1`,
        [type, price]
      );
      return result.rows[0] || null;
    },

    async findPayQrcodes(query) {
      logger.info(`开始分页查询固定金额二维码，page=${query.page}，limit=${query.limit}，type=${query.type ?? 'all'}`);

      const conditions = [];
      const values = [];

      if (query.type != null) {
        values.push(query.type);
        conditions.push(`type = $${values.length}`);
      }

      const whereSql = conditions.length > 0
        ? `where ${conditions.join(' and ')}`
        : '';

      const countSql = `select count(*)::int as total from pay_qrcodes ${whereSql}`;
      const countResult = await db.query(countSql, values);

      const offset = (query.page - 1) * query.limit;
      const listValues = [...values, query.limit, offset];
      const listSql = [
        'select id, pay_url as "payUrl", price, type',
        'from pay_qrcodes',
        whereSql,
        `order by id desc limit $${listValues.length - 1} offset $${listValues.length}`
      ].filter(Boolean).join(' ');

      const listResult = await db.query(listSql, listValues);

      logger.info(`固定金额二维码分页查询完成，count=${countResult.rows[0].total}`);
      return {
        count: countResult.rows[0].total,
        rows: listResult.rows
      };
    },

    async deletePayQrcodeById(id) {
      logger.info(`开始删除固定金额二维码，id=${id}`);
      await db.query('delete from pay_qrcodes where id = $1', [id]);
      logger.info(`固定金额二维码删除完成，id=${id}`);
    }
  };
}

module.exports = {
  createPayQrcodeRepository
};

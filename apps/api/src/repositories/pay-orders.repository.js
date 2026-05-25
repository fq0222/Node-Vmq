/**
 * 订单仓储模块
 * 统一封装 pay_orders 表读写逻辑，避免业务层直接拼接 SQL
 */

const { createLogger } = require('../utils/logger');

const logger = createLogger('api:repo:pay-orders');

/**
 * 订单字段选择片段
 * 统一保持仓储返回结构一致，减少重复 SQL
 */
const ORDER_SELECT_FIELDS = `select
  id,
  order_id as "orderId",
  pay_id as "payId",
  create_date as "createDate",
  pay_date as "payDate",
  close_date as "closeDate",
  param,
  type,
  price,
  really_price as "reallyPrice",
  notify_url as "notifyUrl",
  return_url as "returnUrl",
  state,
  is_auto as "isAuto",
  pay_url as "payUrl"
from pay_orders`;

/**
 * 创建订单仓储
 * @param {{query: Function}} db - 数据库连接对象
 * @returns {object} 订单仓储对象
 */
function createPayOrdersRepository(db) {
  return {
    async findByPayId(payId) {
      logger.info(`开始按 payId 查询订单，payId=${payId}`);
      const result = await db.query(
        `${ORDER_SELECT_FIELDS}
        where pay_id = $1
        limit 1`,
        [payId]
      );
      return result.rows[0] || null;
    },

    async findByOrderId(orderId) {
      logger.info(`开始按 orderId 查询订单，orderId=${orderId}`);
      const result = await db.query(
        `${ORDER_SELECT_FIELDS}
        where order_id = $1
        limit 1`,
        [orderId]
      );
      return result.rows[0] || null;
    },

    async findById(id) {
      logger.info(`开始按 id 查询订单，id=${id}`);
      const result = await db.query(
        `${ORDER_SELECT_FIELDS}
        where id = $1
        limit 1`,
        [id]
      );
      return result.rows[0] || null;
    },

    async findByPayDate(payDate) {
      logger.info(`开始按 payDate 查询订单，payDate=${payDate}`);
      const result = await db.query(
        `${ORDER_SELECT_FIELDS}
        where pay_date = $1
        limit 1`,
        [payDate]
      );
      return result.rows[0] || null;
    },

    async findPendingByReallyPriceAndType(reallyPrice, type) {
      logger.info(`开始按金额与类型查询待支付订单，type=${type}，reallyPrice=${reallyPrice}`);
      const result = await db.query(
        `${ORDER_SELECT_FIELDS}
        where really_price = $1 and state = 0 and type = $2
        limit 1`,
        [reallyPrice, type]
      );
      return result.rows[0] || null;
    },

    async findOrders(filters) {
      logger.info(`开始分页查询订单，page=${filters.page}，limit=${filters.limit}`);

      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (filters.type != null) {
        conditions.push(`type = $${paramIndex}`);
        params.push(filters.type);
        paramIndex += 1;
      }

      if (filters.state != null) {
        conditions.push(`state = $${paramIndex}`);
        params.push(filters.state);
        paramIndex += 1;
      }

      const whereClause = conditions.length > 0
        ? `where ${conditions.join(' and ')}`
        : '';

      const countResult = await db.query(
        `select count(*)::int as count
        from pay_orders
        ${whereClause}`,
        params
      );

      const offset = (filters.page - 1) * filters.limit;
      const listParams = [...params, filters.limit, offset];
      const listResult = await db.query(
        `${ORDER_SELECT_FIELDS}
        ${whereClause}
        order by id desc
        limit $${paramIndex} offset $${paramIndex + 1}`,
        listParams
      );

      return {
        count: countResult.rows[0]?.count || 0,
        rows: listResult.rows
      };
    },

    async createPayOrder(payload) {
      logger.info(`开始新增订单，orderId=${payload.orderId}`);
      await db.query(
        `insert into pay_orders(
          order_id, pay_id, create_date, pay_date, close_date, param, type,
          price, really_price, notify_url, return_url, state, is_auto, pay_url
        ) values (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14
        )`,
        [
          payload.orderId,
          payload.payId,
          payload.createDate,
          payload.payDate,
          payload.closeDate,
          payload.param,
          payload.type,
          payload.price,
          payload.reallyPrice,
          payload.notifyUrl,
          payload.returnUrl,
          payload.state,
          payload.isAuto,
          payload.payUrl
        ]
      );
      logger.info(`订单新增完成，orderId=${payload.orderId}`);
    },

    async savePayOrder(payload) {
      logger.info(`开始保存订单，id=${payload.id}`);
      await db.query(
        `update pay_orders
        set
          pay_date = $2,
          close_date = $3,
          state = $4
        where id = $1`,
        [
          payload.id,
          payload.payDate,
          payload.closeDate,
          payload.state
        ]
      );
      logger.info(`订单保存完成，id=${payload.id}`);
    },

    async updateOrderState(id, state) {
      logger.info(`开始单独更新订单状态，id=${id}，state=${state}`);
      await db.query(
        `update pay_orders
        set state = $2
        where id = $1`,
        [id, state]
      );
      logger.info(`订单状态更新完成，id=${id}，state=${state}`);
    },

    async deleteOrderById(id) {
      logger.info(`开始删除单条订单，id=${id}`);
      await db.query(
        'delete from pay_orders where id = $1',
        [id]
      );
      logger.info(`单条订单删除完成，id=${id}`);
    },

    async deleteOrdersByState(state) {
      logger.info(`开始按状态批量删除订单，state=${state}`);
      await db.query(
        'delete from pay_orders where state = $1',
        [state]
      );
      logger.info(`按状态批量删除订单完成，state=${state}`);
    },

    async deleteOrdersCreatedBefore(threshold) {
      logger.info(`开始删除指定时间前订单，threshold=${threshold}`);
      await db.query(
        'delete from pay_orders where create_date < $1',
        [threshold]
      );
      logger.info(`删除指定时间前订单完成，threshold=${threshold}`);
    }
  };
}

module.exports = {
  createPayOrdersRepository
};

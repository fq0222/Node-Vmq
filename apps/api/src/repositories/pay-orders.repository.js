/**
 * 订单仓储模块
 * 统一封装 pay_orders 表读写与统计逻辑，避免业务层直接拼接 SQL
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
  /**
   * 按条件统计订单数量
   * @param {string} whereClause - where 子句
   * @param {Array<number>} params - SQL 参数
   * @returns {Promise<number>} 统计数量
   */
  async function countByWhere(whereClause, params) {
    const result = await db.query(
      `select count(*)::int as count
      from pay_orders
      ${whereClause}`,
      params
    );
    return result.rows[0]?.count || 0;
  }

  /**
   * 按条件汇总订单金额
   * 统计口径保持与原项目一致，使用 price 字段而非 really_price
   * @param {string} whereClause - where 子句
   * @param {Array<number>} params - SQL 参数
   * @returns {Promise<number|null>} 汇总金额
   */
  async function sumPriceByWhere(whereClause, params) {
    const result = await db.query(
      `select sum(price)::numeric as amount
      from pay_orders
      ${whereClause}`,
      params
    );
    return result.rows[0]?.amount == null ? null : Number(result.rows[0].amount);
  }

  return {
    /**
     * 按 payId 查询订单
     * @param {string} payId - 商户订单号
     * @returns {Promise<Record<string, unknown>|null>} 订单记录
     */
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

    /**
     * 按 orderId 查询订单
     * @param {string} orderId - 平台订单号
     * @returns {Promise<Record<string, unknown>|null>} 订单记录
     */
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

    /**
     * 按主键查询订单
     * @param {number} id - 主键 ID
     * @returns {Promise<Record<string, unknown>|null>} 订单记录
     */
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

    /**
     * 按支付时间查询订单
     * @param {number} payDate - 支付时间
     * @returns {Promise<Record<string, unknown>|null>} 订单记录
     */
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

    /**
     * 按实际金额与支付类型查询待支付订单
     * @param {number|string} reallyPrice - 实际金额
     * @param {number} type - 支付类型
     * @returns {Promise<Record<string, unknown>|null>} 订单记录
     */
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

    /**
     * 分页查询订单列表
     * @param {{page: number, limit: number, type: number|null, state: number|null}} filters - 查询条件
     * @returns {Promise<{count: number, rows: Array<Record<string, unknown>>}>} 分页结果
     */
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

    /**
     * 按关闭时间查询订单
     * @param {number} closeDate - 关闭时间
     * @returns {Promise<Array<Record<string, unknown>>>} 订单列表
     */
    async findOrdersByCloseDate(closeDate) {
      logger.info(`开始按 closeDate 查询订单，closeDate=${closeDate}`);
      const result = await db.query(
        `${ORDER_SELECT_FIELDS}
        where close_date = $1`,
        [closeDate]
      );
      return result.rows;
    },

    /**
     * 批量关闭超时订单
     * @param {{timeoutBefore: number, closeDate: number}} payload - 超时关单参数
     * @returns {Promise<number>} 关闭数量
     */
    async markTimeoutOrders(payload) {
      logger.info(`开始批量关闭超时订单，timeoutBefore=${payload.timeoutBefore}，closeDate=${payload.closeDate}`);
      const result = await db.query(
        `update pay_orders
        set state = -1, close_date = $2
        where create_date < $1 and state = 0`,
        [payload.timeoutBefore, payload.closeDate]
      );
      logger.info(`批量关闭超时订单完成，count=${result.rowCount}`);
      return result.rowCount;
    },

    /**
     * 新增订单记录
     * @param {Record<string, unknown>} payload - 订单数据
     * @returns {Promise<void>}
     */
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

    /**
     * 保存订单支付时间、关闭时间与状态
     * @param {{id: number, payDate: number, closeDate: number, state: number}} payload - 订单更新数据
     * @returns {Promise<void>}
     */
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

    /**
     * 单独更新订单状态
     * @param {number} id - 订单主键
     * @param {number} state - 目标状态
     * @returns {Promise<void>}
     */
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

    /**
     * 删除单条订单
     * @param {number} id - 订单主键
     * @returns {Promise<void>}
     */
    async deleteOrderById(id) {
      logger.info(`开始删除单条订单，id=${id}`);
      await db.query(
        'delete from pay_orders where id = $1',
        [id]
      );
      logger.info(`单条订单删除完成，id=${id}`);
    },

    /**
     * 按状态批量删除订单
     * @param {number} state - 订单状态
     * @returns {Promise<void>}
     */
    async deleteOrdersByState(state) {
      logger.info(`开始按状态批量删除订单，state=${state}`);
      await db.query(
        'delete from pay_orders where state = $1',
        [state]
      );
      logger.info(`按状态批量删除订单完成，state=${state}`);
    },

    /**
     * 删除指定时间之前的订单
     * @param {number} threshold - 时间阈值
     * @returns {Promise<void>}
     */
    async deleteOrdersCreatedBefore(threshold) {
      logger.info(`开始删除指定时间前订单，threshold=${threshold}`);
      await db.query(
        'delete from pay_orders where create_date < $1',
        [threshold]
      );
      logger.info(`删除指定时间前订单完成，threshold=${threshold}`);
    },

    /**
     * 统计指定时间范围内的订单总数
     * @param {number} startTime - 开始时间
     * @param {number} endTime - 结束时间
     * @returns {Promise<number>} 订单数量
     */
    async countOrdersByCreateDateRange(startTime, endTime) {
      logger.info(`开始统计时间范围内订单总数，startTime=${startTime}，endTime=${endTime}`);
      return countByWhere('where create_date >= $1 and create_date <= $2', [startTime, endTime]);
    },

    /**
     * 统计指定时间范围内指定状态的订单数量
     * @param {number} startTime - 开始时间
     * @param {number} endTime - 结束时间
     * @param {number} state - 订单状态
     * @returns {Promise<number>} 订单数量
     */
    async countOrdersByCreateDateRangeAndState(startTime, endTime, state) {
      logger.info(`开始统计时间范围内指定状态订单数量，startTime=${startTime}，endTime=${endTime}，state=${state}`);
      return countByWhere('where create_date >= $1 and create_date <= $2 and state = $3', [startTime, endTime, state]);
    },

    /**
     * 汇总指定时间范围内指定状态的订单金额
     * @param {number} startTime - 开始时间
     * @param {number} endTime - 结束时间
     * @param {number} state - 订单状态
     * @returns {Promise<number|null>} 汇总金额
     */
    async sumPricesByCreateDateRangeAndState(startTime, endTime, state) {
      logger.info(`开始汇总时间范围内指定状态订单金额，startTime=${startTime}，endTime=${endTime}，state=${state}`);
      return sumPriceByWhere('where create_date >= $1 and create_date <= $2 and state = $3', [startTime, endTime, state]);
    },

    /**
     * 统计指定状态的订单数量
     * @param {number} state - 订单状态
     * @returns {Promise<number>} 订单数量
     */
    async countOrdersByState(state) {
      logger.info(`开始统计指定状态订单数量，state=${state}`);
      return countByWhere('where state = $1', [state]);
    },

    /**
     * 汇总指定状态的订单金额
     * @param {number} state - 订单状态
     * @returns {Promise<number|null>} 汇总金额
     */
    async sumPricesByState(state) {
      logger.info(`开始汇总指定状态订单金额，state=${state}`);
      return sumPriceByWhere('where state = $1', [state]);
    }
  };
}

module.exports = {
  createPayOrdersRepository
};

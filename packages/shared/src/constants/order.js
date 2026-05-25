/**
 * 订单状态常量
 * 用于统一约束订单生命周期中的状态值
 */

/**
 * 订单状态枚举
 * 必须与原系统保持一致
 */
const ORDER_STATES = {
  EXPIRED: -1,
  PENDING: 0,
  PAID: 1,
  NOTIFY_FAILED: 2
};

module.exports = {
  ORDER_STATES
};

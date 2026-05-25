/**
 * shared 包统一导出入口
 * 统一聚合 TP-03 共享规则与兼容常量
 */

const { WORKSPACE_NAME, CURRENT_STAGE } = require('./constants/system');
const { PAYMENT_TYPES } = require('./constants/payment');
const { ORDER_STATES } = require('./constants/order');
const { SETTING_KEYS } = require('./constants/settings');
const {
  md5,
  signCreateOrder,
  signCloseOrder,
  signAppHeart,
  signAppPush,
  signNotifyCallback
} = require('./signatures');
const {
  amountToCents,
  centsToAmount,
  formatAmount,
  addAmountStep,
  subtractAmountStep,
  buildPriceKey
} = require('./amounts');
const { isClientTimeSkewValid } = require('./time');

module.exports = {
  WORKSPACE_NAME,
  CURRENT_STAGE,
  PAYMENT_TYPES,
  ORDER_STATES,
  SETTING_KEYS,
  md5,
  signCreateOrder,
  signCloseOrder,
  signAppHeart,
  signAppPush,
  signNotifyCallback,
  amountToCents,
  centsToAmount,
  formatAmount,
  addAmountStep,
  subtractAmountStep,
  buildPriceKey,
  isClientTimeSkewValid
};

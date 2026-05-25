/**
 * 监控端兼容服务模块
 * 负责处理心跳上报、支付推送与监控状态查询逻辑
 */

const {
  ORDER_STATES,
  SETTING_KEYS,
  signAppHeart,
  signAppPush,
  signNotifyCallback,
  isClientTimeSkewValid,
  formatAmount,
  buildPriceKey
} = require('../../../../packages/shared/src');
const { createLogger } = require('../utils/logger');
const { success, error } = require('../utils/response');

const logger = createLogger('api:service:monitor');

/**
 * 构建异步通知查询字符串
 * 保持与原项目一致，直接拼接旧版参数结构
 * @param {Record<string, unknown>} order - 订单记录
 * @param {string} key - 通讯密钥
 * @returns {string} 查询字符串
 */
function buildNotifyQuery(order, key) {
  const price = String(Number(order.price));
  const reallyPrice = String(Number(order.reallyPrice));
  const sign = signNotifyCallback({
    payId: order.payId,
    param: order.param || '',
    type: Number(order.type),
    price,
    reallyPrice,
    key
  });

  return `payId=${order.payId}&param=${order.param || ''}&type=${order.type}&price=${price}&reallyPrice=${reallyPrice}&sign=${sign}`;
}

/**
 * 构建无订单转账补录记录
 * 为避免唯一约束冲突，内部编号追加时间戳后缀
 * @param {number} type - 支付方式
 * @param {number} amount - 支付金额
 * @param {number} timestamp - 当前时间戳
 * @returns {Record<string, unknown>} 订单记录
 */
function buildNoOrderTransferRecord(type, amount, timestamp) {
  const uniqueSuffix = `${timestamp}${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const fallbackId = `无订单转账-${uniqueSuffix}`;

  return {
    payId: fallbackId,
    orderId: fallbackId,
    createDate: timestamp,
    payDate: timestamp,
    closeDate: timestamp,
    param: '无订单转账',
    type,
    price: amount,
    reallyPrice: amount,
    notifyUrl: '',
    returnUrl: '',
    state: ORDER_STATES.PAID,
    isAuto: 0,
    payUrl: '无订单转账'
  };
}

/**
 * 发送异步通知
 * 只有响应体严格等于 success 才视为成功
 * @param {string} url - 异步通知地址
 * @param {string} query - 查询字符串
 * @param {(url: string) => Promise<{text: Function}>} fetchImpl - fetch 实现
 * @returns {Promise<boolean>} 是否通知成功
 */
async function notifyMerchant(url, query, fetchImpl) {
  const requestUrl = `${url}?${query}`;
  logger.info(`开始通知商户异步地址，url=${requestUrl}`);

  try {
    const response = await fetchImpl(requestUrl);
    const responseText = await response.text();
    const normalizedText = String(responseText || '').trim();
    const succeeded = normalizedText === 'success';

    if (succeeded) {
      logger.info('商户异步通知返回 success');
      return true;
    }

    logger.warn(`商户异步通知返回非 success，body=${normalizedText}`);
    return false;
  } catch (notifyError) {
    logger.error(`商户异步通知请求异常：${notifyError.message}`);
    return false;
  }
}

async function appHeart(payload, deps) {
  logger.info('开始处理监控端心跳上报');

  const timestamp = String(payload.t || '');
  const sign = String(payload.sign || '');
  const key = await deps.settingsRepository.getSettingValue(SETTING_KEYS.KEY);
  const now = deps.now ? deps.now() : Date.now();

  if (sign !== signAppHeart({ timestamp, key })) {
    logger.warn('监控端心跳签名校验失败');
    return error('签名校验错误');
  }

  if (!isClientTimeSkewValid(timestamp, now)) {
    logger.warn(`监控端心跳时间偏差超限，client=${timestamp}，server=${now}`);
    return error('客户端时间错误');
  }

  await deps.settingsRepository.saveSettingValue(SETTING_KEYS.LAST_HEART, timestamp);
  await deps.settingsRepository.saveSettingValue(SETTING_KEYS.MONITOR_STATUS, '1');
  logger.info(`监控端心跳处理完成，t=${timestamp}`);
  return success();
}

async function getState(payload, deps) {
  logger.info('开始查询监控端状态');

  const timestamp = String(payload.t || '');
  const sign = String(payload.sign || '');
  const key = await deps.settingsRepository.getSettingValue(SETTING_KEYS.KEY);

  if (sign !== signAppHeart({ timestamp, key })) {
    logger.warn('监控端状态查询签名校验失败');
    return error('签名校验不通过');
  }

  const state = await deps.settingsRepository.getSettingValue(SETTING_KEYS.MONITOR_STATUS) || '0';
  const lastheart = await deps.settingsRepository.getSettingValue(SETTING_KEYS.LAST_HEART) || '0';
  const lastpay = await deps.settingsRepository.getSettingValue(SETTING_KEYS.LAST_PAY) || '0';

  return success({
    state,
    lastheart,
    lastpay
  });
}

async function appPush(payload, deps) {
  logger.info('开始处理监控端支付推送');

  const type = Number(payload.type || 0);
  const price = formatAmount(payload.price || '0');
  const timestamp = String(payload.t || '');
  const sign = String(payload.sign || '');
  const key = await deps.settingsRepository.getSettingValue(SETTING_KEYS.KEY);
  const now = deps.now ? deps.now() : Date.now();

  if (!isClientTimeSkewValid(timestamp, now)) {
    logger.warn(`支付推送时间偏差超限，client=${timestamp}，server=${now}`);
    return error('客户端时间错误');
  }

  if (sign !== signAppPush({ type, price, timestamp, key })) {
    logger.warn(`支付推送签名校验失败，type=${type}，price=${price}`);
    return error('签名校验错误');
  }

  await deps.settingsRepository.saveSettingValue(SETTING_KEYS.LAST_PAY, timestamp);

  const duplicateOrder = await deps.payOrdersRepository.findByPayDate(Number(timestamp));
  if (duplicateOrder) {
    logger.warn(`支付推送被判定为重复，t=${timestamp}`);
    return error('重复推送');
  }

  const pendingOrder = await deps.payOrdersRepository.findPendingByReallyPriceAndType(Number(price), type);
  if (!pendingOrder) {
    const fallbackOrder = buildNoOrderTransferRecord(type, Number(price), now);
    await deps.payOrdersRepository.createPayOrder(fallbackOrder);
    logger.info(`支付推送未命中订单，已补录无订单转账记录，amount=${price}`);
    return success();
  }

  await deps.tmpPricesRepository.releasePriceKey(buildPriceKey(type, price));

  await deps.payOrdersRepository.savePayOrder({
    ...pendingOrder,
    payDate: now,
    closeDate: now,
    state: ORDER_STATES.PAID
  });

  let notifyUrl = pendingOrder.notifyUrl || '';
  if (!notifyUrl) {
    notifyUrl = await deps.settingsRepository.getSettingValue(SETTING_KEYS.NOTIFY_URL) || '';
  }

  if (!notifyUrl) {
    await deps.payOrdersRepository.updateOrderState(pendingOrder.id, ORDER_STATES.NOTIFY_FAILED);
    logger.warn(`订单已支付但未配置异步通知地址，orderId=${pendingOrder.orderId}`);
    return error('您还未配置异步通知地址，请在系统配置中配置');
  }

  const query = buildNotifyQuery(pendingOrder, key);
  const fetchImpl = deps.fetchImpl || global.fetch;
  const notifySucceeded = await notifyMerchant(notifyUrl, query, fetchImpl);

  if (notifySucceeded) {
    logger.info(`订单支付推送处理完成并通知成功，orderId=${pendingOrder.orderId}`);
    return success();
  }

  await deps.payOrdersRepository.updateOrderState(pendingOrder.id, ORDER_STATES.NOTIFY_FAILED);
  logger.warn(`订单支付推送通知失败，orderId=${pendingOrder.orderId}`);
  return error('通知异步地址失败');
}

module.exports = {
  buildNotifyQuery,
  appHeart,
  appPush,
  getState
};

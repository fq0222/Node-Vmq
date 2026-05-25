/**
 * 回调与补单服务模块
 * 负责后台订单分页、手动补通知与订单清理逻辑
 */

const {
  ORDER_STATES,
  SETTING_KEYS,
  signNotifyCallback,
  buildPriceKey
} = require('../../../../packages/shared/src');
const { createLogger } = require('../utils/logger');
const { success, error } = require('../utils/response');

const logger = createLogger('api:service:callback-admin');

/**
 * 构建补通知查询字符串
 * 保持与原项目兼容的参数格式
 * @param {Record<string, unknown>} order - 订单记录
 * @param {string} key - 通讯密钥
 * @returns {string} 查询字符串
 */
function buildRetryNotifyQuery(order, key) {
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
 * 分页查询订单
 * @param {{page?: string|number, limit?: string|number, type?: string|number, state?: string|number}} payload - 查询参数
 * @param {{findOrders: Function}} repository - 仓储对象
 * @returns {Promise<{code: number, msg: string, count: number, data: Array<Record<string, unknown>>}>} 分页结果
 */
async function getOrders(payload, repository) {
  logger.info('开始分页查询订单');

  const page = Number(payload.page || 1);
  const limit = Number(payload.limit || 20);
  const typeValue = payload.type == null || payload.type === ''
    ? null
    : Number(payload.type);
  const stateValue = payload.state == null || payload.state === ''
    ? null
    : Number(payload.state);

  const result = await repository.findOrders({
    page,
    limit,
    type: typeValue,
    state: stateValue
  });

  logger.info(`订单分页查询完成，count=${result.count}`);
  return {
    code: 0,
    msg: '',
    count: result.count,
    data: result.rows
  };
}

/**
 * 手动重发订单异步通知
 * @param {{id?: string|number}} payload - 补单参数
 * @param {{
 *   settingsRepository: {getSettingValue: Function},
 *   payOrdersRepository: {findById: Function, updateOrderState: Function},
 *   tmpPricesRepository: {releasePriceKey: Function},
 *   fetchImpl?: (url: string) => Promise<{text: Function}>
 * }} deps - 依赖集合
 * @returns {Promise<{code: number, msg: string, data: null}>} 执行结果
 */
async function retryOrderCallback(payload, deps) {
  const id = Number(payload.id || 0);
  logger.info(`开始手动补发异步通知，id=${id}`);

  const order = await deps.payOrdersRepository.findById(id);
  if (!order) {
    logger.warn(`手动补发异步通知失败，订单不存在，id=${id}`);
    return error('订单不存在');
  }

  const key = await deps.settingsRepository.getSettingValue(SETTING_KEYS.KEY);
  let notifyUrl = order.notifyUrl || '';
  if (!notifyUrl) {
    notifyUrl = await deps.settingsRepository.getSettingValue(SETTING_KEYS.NOTIFY_URL) || '';
  }

  if (!notifyUrl) {
    logger.warn(`手动补发异步通知失败，未配置通知地址，id=${id}`);
    return error('您还未配置异步通知地址，请在系统配置中配置');
  }

  const query = buildRetryNotifyQuery(order, key);
  const requestUrl = `${notifyUrl}?${query}`;
  const fetchImpl = deps.fetchImpl || global.fetch;
  const response = await fetchImpl(requestUrl);
  const responseText = String(await response.text()).trim();

  if (responseText === 'success') {
    if (Number(order.state) === ORDER_STATES.PENDING) {
      await deps.tmpPricesRepository.releasePriceKey(buildPriceKey(Number(order.type), order.reallyPrice));
    }

    await deps.payOrdersRepository.updateOrderState(id, ORDER_STATES.PAID);
    logger.info(`手动补发异步通知成功，id=${id}`);
    return success();
  }

  logger.warn(`手动补发异步通知失败，id=${id}，body=${responseText}`);
  return error(responseText, null, -2);
}

/**
 * 删除单条订单
 * @param {{id?: string|number}} payload - 删除参数
 * @param {{findById: Function, deleteOrderById: Function}} repository - 订单仓储
 * @param {{releasePriceKey: Function}} tmpPricesRepository - 金额占位仓储
 * @returns {Promise<{code: number, msg: string, data: null}>} 删除结果
 */
async function delOrder(payload, repository, tmpPricesRepository) {
  const id = Number(payload.id || 0);
  logger.info(`开始删除单条订单，id=${id}`);

  const order = await repository.findById(id);
  if (order && Number(order.state) === ORDER_STATES.PENDING) {
    await tmpPricesRepository.releasePriceKey(buildPriceKey(Number(order.type), order.reallyPrice));
  }

  await repository.deleteOrderById(id);
  logger.info(`单条订单删除完成，id=${id}`);
  return success();
}

/**
 * 删除过期订单
 * @param {{deleteOrdersByState: Function}} repository - 订单仓储
 * @returns {Promise<{code: number, msg: string, data: null}>} 删除结果
 */
async function delGqOrder(repository) {
  logger.info('开始批量删除过期订单');
  await repository.deleteOrdersByState(ORDER_STATES.EXPIRED);
  logger.info('过期订单删除完成');
  return success();
}

/**
 * 删除七天前旧订单
 * @param {{deleteOrdersCreatedBefore: Function}} repository - 订单仓储
 * @param {{now?: () => number}} [deps={}] - 依赖集合
 * @returns {Promise<{code: number, msg: string, data: null}>} 删除结果
 */
async function delLastOrder(repository, deps = {}) {
  logger.info('开始批量删除七天前旧订单');
  const now = deps.now ? deps.now() : Date.now();
  const threshold = now - (7 * 86400 * 1000);
  await repository.deleteOrdersCreatedBefore(threshold);
  logger.info(`七天前旧订单删除完成，threshold=${threshold}`);
  return success();
}

module.exports = {
  buildRetryNotifyQuery,
  getOrders,
  retryOrderCallback,
  delOrder,
  delGqOrder,
  delLastOrder
};

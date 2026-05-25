/**
 * 回调与补单控制器模块
 * 负责后台订单列表、补通知与清理接口的参数提取和响应编排
 */

const { createLogger } = require('../utils/logger');
const { createPayOrdersRepository } = require('../repositories/pay-orders.repository');
const { createTmpPricesRepository } = require('../repositories/tmp-prices.repository');
const { createSettingsRepository } = require('../repositories/settings.repository');
const {
  getOrders: defaultGetOrders,
  retryOrderCallback: defaultRetryOrderCallback,
  delOrder: defaultDelOrder,
  delGqOrder: defaultDelGqOrder,
  delLastOrder: defaultDelLastOrder
} = require('../services/callback-admin.service');

const logger = createLogger('api:controller:callback-admin');

/**
 * 提取订单分页查询参数
 * @param {import('express').Request} req - 请求对象
 * @returns {{page?: string, limit?: string, type?: string, state?: string}} 参数对象
 */
function getOrdersPayload(req) {
  return {
    page: req.body?.page || req.query?.page,
    limit: req.body?.limit || req.query?.limit,
    type: req.body?.type || req.query?.type,
    state: req.body?.state || req.query?.state
  };
}

/**
 * 提取通用主键参数
 * @param {import('express').Request} req - 请求对象
 * @returns {{id?: string}} 参数对象
 */
function getIdPayload(req) {
  return {
    id: req.body?.id || req.query?.id
  };
}

/**
 * 后台订单分页查询控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{getOrders?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function getOrdersController(req, res, deps = {}) {
  logger.info('收到后台订单分页查询请求');

  const getOrders = deps.getOrders || defaultGetOrders;
  const payload = getOrdersPayload(req);

  let result;
  if (deps.getOrders) {
    result = await getOrders(payload);
  } else {
    result = await getOrders(payload, createPayOrdersRepository(req.app.locals.db));
  }

  res.json(result);
}

/**
 * 后台手动补单控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{retryOrderCallback?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function setBdController(req, res, deps = {}) {
  logger.info('收到后台手动补单请求');

  const retryOrderCallback = deps.retryOrderCallback || defaultRetryOrderCallback;
  const payload = getIdPayload(req);

  let result;
  if (deps.retryOrderCallback) {
    result = await retryOrderCallback(payload);
  } else {
    const db = req.app.locals.db;
    result = await retryOrderCallback(payload, {
      settingsRepository: createSettingsRepository(db),
      payOrdersRepository: createPayOrdersRepository(db),
      tmpPricesRepository: createTmpPricesRepository(db)
    });
  }

  res.json(result);
}

/**
 * 后台删除单条订单控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{delOrder?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function delOrderController(req, res, deps = {}) {
  logger.info('收到后台删除单条订单请求');

  const delOrder = deps.delOrder || defaultDelOrder;
  const payload = getIdPayload(req);

  let result;
  if (deps.delOrder) {
    result = await delOrder(payload);
  } else {
    const db = req.app.locals.db;
    result = await delOrder(payload, createPayOrdersRepository(db), createTmpPricesRepository(db));
  }

  res.json(result);
}

/**
 * 后台批量删除过期订单控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{delGqOrder?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function delGqOrderController(req, res, deps = {}) {
  logger.info('收到后台批量删除过期订单请求');

  const delGqOrder = deps.delGqOrder || defaultDelGqOrder;

  let result;
  if (deps.delGqOrder) {
    result = await delGqOrder();
  } else {
    result = await delGqOrder(createPayOrdersRepository(req.app.locals.db));
  }

  res.json(result);
}

/**
 * 后台批量删除旧订单控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{delLastOrder?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function delLastOrderController(req, res, deps = {}) {
  logger.info('收到后台批量删除旧订单请求');

  const delLastOrder = deps.delLastOrder || defaultDelLastOrder;

  let result;
  if (deps.delLastOrder) {
    result = await delLastOrder();
  } else {
    result = await delLastOrder(createPayOrdersRepository(req.app.locals.db));
  }

  res.json(result);
}

module.exports = {
  getOrdersPayload,
  getIdPayload,
  getOrdersController,
  setBdController,
  delOrderController,
  delGqOrderController,
  delLastOrderController
};

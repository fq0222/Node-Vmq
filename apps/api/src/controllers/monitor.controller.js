/**
 * 监控端兼容控制器模块
 * 负责心跳、支付推送与状态查询接口的参数提取和响应编排
 */

const { createLogger } = require('../utils/logger');
const { createSettingsRepository } = require('../repositories/settings.repository');
const { createPayOrdersRepository } = require('../repositories/pay-orders.repository');
const { createTmpPricesRepository } = require('../repositories/tmp-prices.repository');
const {
  appHeart: defaultAppHeart,
  appPush: defaultAppPush,
  getState: defaultGetState
} = require('../services/monitor.service');

const logger = createLogger('api:controller:monitor');

function getSignedTimestampPayload(req) {
  return {
    t: req.body?.t || req.query?.t || '',
    sign: req.body?.sign || req.query?.sign || ''
  };
}

function getPushPayload(req) {
  return {
    type: req.body?.type || req.query?.type || '',
    price: req.body?.price || req.query?.price || '',
    t: req.body?.t || req.query?.t || '',
    sign: req.body?.sign || req.query?.sign || ''
  };
}

async function appHeartController(req, res, deps = {}) {
  logger.info('收到监控端心跳请求');

  const appHeart = deps.appHeart || defaultAppHeart;
  const payload = getSignedTimestampPayload(req);

  let result;
  if (deps.appHeart) {
    result = await appHeart(payload);
  } else {
    const db = req.app.locals.db;
    result = await appHeart(payload, {
      settingsRepository: createSettingsRepository(db)
    });
  }

  res.json(result);
}

async function appPushController(req, res, deps = {}) {
  logger.info('收到监控端支付推送请求');

  const appPush = deps.appPush || defaultAppPush;
  const payload = getPushPayload(req);

  let result;
  if (deps.appPush) {
    result = await appPush(payload);
  } else {
    const db = req.app.locals.db;
    result = await appPush(payload, {
      settingsRepository: createSettingsRepository(db),
      payOrdersRepository: createPayOrdersRepository(db),
      tmpPricesRepository: createTmpPricesRepository(db)
    });
  }

  res.json(result);
}

async function getStateController(req, res, deps = {}) {
  logger.info('收到监控端状态查询请求');

  const getState = deps.getState || defaultGetState;
  const payload = getSignedTimestampPayload(req);

  let result;
  if (deps.getState) {
    result = await getState(payload);
  } else {
    const db = req.app.locals.db;
    result = await getState(payload, {
      settingsRepository: createSettingsRepository(db)
    });
  }

  res.json(result);
}

module.exports = {
  getSignedTimestampPayload,
  getPushPayload,
  appHeartController,
  appPushController,
  getStateController
};

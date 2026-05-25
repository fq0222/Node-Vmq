/**
 * 订单核心控制器模块
 * 负责订单接口的参数提取与 JSON/HTML 兼容响应编排
 */

const { createLogger } = require('../utils/logger');
const { createSettingsRepository } = require('../repositories/settings.repository');
const { createPayOrdersRepository } = require('../repositories/pay-orders.repository');
const { createTmpPricesRepository } = require('../repositories/tmp-prices.repository');
const { createPayQrcodeRepository } = require('../repositories/pay-qrcode.repository');
const {
  createOrder: defaultCreateOrder,
  closeOrder: defaultCloseOrder,
  getOrder: defaultGetOrder,
  checkOrder: defaultCheckOrder
} = require('../services/order.service');

const logger = createLogger('api:controller:order');

function getCreateOrderPayload(req) {
  return {
    payId: req.body?.payId || req.query?.payId,
    param: req.body?.param || req.query?.param || '',
    type: req.body?.type || req.query?.type,
    price: req.body?.price || req.query?.price,
    notifyUrl: req.body?.notifyUrl || req.query?.notifyUrl || '',
    returnUrl: req.body?.returnUrl || req.query?.returnUrl || '',
    sign: req.body?.sign || req.query?.sign,
    isHtml: req.body?.isHtml || req.query?.isHtml || '0'
  };
}

function getOrderId(req) {
  return req.body?.orderId || req.query?.orderId || '';
}

function getCloseOrderPayload(req) {
  return {
    orderId: req.body?.orderId || req.query?.orderId || '',
    sign: req.body?.sign || req.query?.sign || ''
  };
}

async function createOrderController(req, res, deps = {}) {
  logger.info('收到创建订单请求');

  const createOrder = deps.createOrder || defaultCreateOrder;
  const payload = getCreateOrderPayload(req);

  let result;
  if (deps.createOrder) {
    result = await createOrder(payload);
  } else {
    const db = req.app.locals.db;
    result = await createOrder(payload, {
      settingsRepository: createSettingsRepository(db),
      payOrdersRepository: createPayOrdersRepository(db),
      tmpPricesRepository: createTmpPricesRepository(db),
      payQrcodeRepository: createPayQrcodeRepository(db)
    });
  }

  if (payload.isHtml === '1' && result.code === 1) {
    res.type('html').send(
      `<script>window.location.href = '/payPage/pay.html?orderId=${result.data.orderId}'</script>`
    );
    return;
  }

  res.json(result);
}

async function getOrderController(req, res, deps = {}) {
  logger.info('收到获取订单详情请求');

  const getOrder = deps.getOrder || defaultGetOrder;
  const orderId = getOrderId(req);

  let result;
  if (deps.getOrder) {
    result = await getOrder(orderId);
  } else {
    const db = req.app.locals.db;
    result = await getOrder(orderId, {
      settingsRepository: createSettingsRepository(db),
      payOrdersRepository: createPayOrdersRepository(db)
    });
  }

  res.json(result);
}

async function checkOrderController(req, res, deps = {}) {
  logger.info('收到检查订单状态请求');

  const checkOrder = deps.checkOrder || defaultCheckOrder;
  const orderId = getOrderId(req);

  let result;
  if (deps.checkOrder) {
    result = await checkOrder(orderId);
  } else {
    const db = req.app.locals.db;
    result = await checkOrder(orderId, {
      settingsRepository: createSettingsRepository(db),
      payOrdersRepository: createPayOrdersRepository(db)
    });
  }

  res.json(result);
}

async function closeOrderController(req, res, deps = {}) {
  logger.info('收到关闭订单请求');

  const closeOrder = deps.closeOrder || defaultCloseOrder;
  const payload = getCloseOrderPayload(req);

  let result;
  if (deps.closeOrder) {
    result = await closeOrder(payload);
  } else {
    const db = req.app.locals.db;
    result = await closeOrder(payload, {
      settingsRepository: createSettingsRepository(db),
      payOrdersRepository: createPayOrdersRepository(db),
      tmpPricesRepository: createTmpPricesRepository(db)
    });
  }

  res.json(result);
}

module.exports = {
  getCreateOrderPayload,
  getCloseOrderPayload,
  createOrderController,
  getOrderController,
  checkOrderController,
  closeOrderController
};

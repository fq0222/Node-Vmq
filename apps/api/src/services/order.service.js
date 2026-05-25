/**
 * 订单核心服务模块
 * 负责创建订单、关闭订单、查询订单与支付状态检查
 */

const {
  PAYMENT_TYPES,
  ORDER_STATES,
  SETTING_KEYS,
  signCreateOrder,
  signCloseOrder,
  signNotifyCallback,
  formatAmount,
  addAmountStep,
  subtractAmountStep,
  buildPriceKey
} = require('../../../../packages/shared/src');
const { createLogger } = require('../utils/logger');
const { success, error } = require('../utils/response');

const logger = createLogger('api:service:order');

function buildOrderId(timestamp, randomFourDigits = defaultRandomFourDigits) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(timestamp));

  const valueMap = {};
  for (const item of parts) {
    if (item.type !== 'literal') {
      valueMap[item.type] = item.value;
    }
  }

  return `${valueMap.year}${valueMap.month}${valueMap.day}${valueMap.hour}${valueMap.minute}${valueMap.second}${randomFourDigits()}`;
}

function defaultRandomFourDigits() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function buildCreateOrderResponse(order, timeOut) {
  return {
    payId: order.payId,
    orderId: order.orderId,
    payType: order.type,
    price: Number(order.price),
    reallyPrice: Number(order.reallyPrice),
    payUrl: order.payUrl,
    isAuto: order.isAuto,
    state: order.state,
    timeOut,
    date: order.createDate
  };
}

function getGeneralPayUrlSettingKey(type) {
  if (type === PAYMENT_TYPES.WECHAT) {
    return SETTING_KEYS.WECHAT_QRCODE;
  }

  return SETTING_KEYS.ALIPAY_QRCODE;
}

async function createOrder(payload, deps) {
  logger.info('开始执行创建订单流程');

  const key = await deps.settingsRepository.getSettingValue(SETTING_KEYS.KEY);
  const payId = String(payload.payId || '');
  const param = String(payload.param || '');
  const type = Number(payload.type || 0);
  const price = formatAmount(payload.price || '0');
  const notifyUrl = String(payload.notifyUrl || '');
  const returnUrl = String(payload.returnUrl || '');
  const sign = String(payload.sign || '');
  const payQf = Number(await deps.settingsRepository.getSettingValue(SETTING_KEYS.PAY_DISTINGUISH_MODE) || 1);

  if (sign !== signCreateOrder({ payId, param, type, price, key })) {
    logger.warn(`创建订单签名校验失败，payId=${payId}`);
    return error('签名校验不通过');
  }

  const timestamp = deps.now ? deps.now() : Date.now();
  const orderId = deps.generateOrderId
    ? deps.generateOrderId(timestamp)
    : buildOrderId(timestamp, deps.randomFourDigits || defaultRandomFourDigits);

  let reallyPrice = price;
  let reservedPriceKey = null;

  while (true) {
    const priceKey = buildPriceKey(type, reallyPrice);
    const reserved = await deps.tmpPricesRepository.tryReservePriceKey(priceKey, timestamp);

    if (reserved) {
      reservedPriceKey = priceKey;
      break;
    }

    reallyPrice = payQf === 1
      ? addAmountStep(reallyPrice)
      : subtractAmountStep(reallyPrice);

    if (Number(reallyPrice) <= 0) {
      logger.warn(`创建订单失败，所有金额均被占用，payId=${payId}`);
      return error('所有金额均被占用');
    }
  }

  const generalPayUrl = await deps.settingsRepository.getSettingValue(getGeneralPayUrlSettingKey(type));
  if (!generalPayUrl) {
    await deps.tmpPricesRepository.releasePriceKey(reservedPriceKey);
    return error('请您先进入后台配置程序');
  }

  const fixedPayQrcode = await deps.payQrcodeRepository.findByPriceAndType(Number(reallyPrice), type);
  const payUrl = fixedPayQrcode ? fixedPayQrcode.payUrl : generalPayUrl;
  const isAuto = fixedPayQrcode ? 0 : 1;

  const duplicateOrder = await deps.payOrdersRepository.findByPayId(payId);
  if (duplicateOrder) {
    await deps.tmpPricesRepository.releasePriceKey(reservedPriceKey);
    logger.warn(`创建订单失败，商户订单号重复，payId=${payId}`);
    return error('商户订单号已存在');
  }

  const orderRecord = {
    payId,
    orderId,
    createDate: timestamp,
    payDate: 0,
    closeDate: 0,
    param,
    type,
    price: Number(price),
    reallyPrice: Number(reallyPrice),
    notifyUrl,
    returnUrl,
    state: ORDER_STATES.PENDING,
    isAuto,
    payUrl
  };

  try {
    await deps.payOrdersRepository.createPayOrder(orderRecord);
  } catch (createError) {
    await deps.tmpPricesRepository.releasePriceKey(reservedPriceKey);
    throw createError;
  }

  const timeOut = Number(await deps.settingsRepository.getSettingValue(SETTING_KEYS.CLOSE_MINUTES) || 5);
  logger.info(`创建订单成功，orderId=${orderId}，reallyPrice=${reallyPrice}`);
  return success(buildCreateOrderResponse(orderRecord, timeOut));
}

async function closeOrder(payload, deps) {
  logger.info('开始执行关闭订单流程');

  const key = await deps.settingsRepository.getSettingValue(SETTING_KEYS.KEY);
  const orderId = String(payload.orderId || '');
  const sign = String(payload.sign || '');

  if (sign !== signCloseOrder({ orderId, key })) {
    return error('签名校验不通过');
  }

  const order = await deps.payOrdersRepository.findByOrderId(orderId);
  if (!order) {
    return error('云端订单编号不存在');
  }

  if (Number(order.state) !== ORDER_STATES.PENDING) {
    return error('订单状态不允许关闭');
  }

  await deps.tmpPricesRepository.releasePriceKey(buildPriceKey(Number(order.type), order.reallyPrice));

  const timestamp = deps.now ? deps.now() : Date.now();
  await deps.payOrdersRepository.savePayOrder({
    ...order,
    payDate: Number(order.payDate || 0),
    closeDate: timestamp,
    state: ORDER_STATES.EXPIRED
  });

  return success();
}

async function getOrder(orderId, deps) {
  logger.info(`开始获取订单详情，orderId=${orderId}`);

  const order = await deps.payOrdersRepository.findByOrderId(orderId);
  if (!order) {
    return error('云端订单编号不存在');
  }

  const timeOut = Number(await deps.settingsRepository.getSettingValue(SETTING_KEYS.CLOSE_MINUTES) || 5);
  return success(buildCreateOrderResponse(order, timeOut));
}

async function checkOrder(orderId, deps) {
  logger.info(`开始检查订单状态，orderId=${orderId}`);

  const order = await deps.payOrdersRepository.findByOrderId(orderId);
  if (!order) {
    return error('云端订单编号不存在');
  }

  if (Number(order.state) === ORDER_STATES.PENDING) {
    return error('订单未支付');
  }

  if (Number(order.state) === ORDER_STATES.EXPIRED) {
    return error('订单已过期');
  }

  const key = await deps.settingsRepository.getSettingValue(SETTING_KEYS.KEY);
  const defaultReturnUrl = await deps.settingsRepository.getSettingValue(SETTING_KEYS.RETURN_URL);
  const returnUrl = order.returnUrl || defaultReturnUrl || '';
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
  const query = `payId=${order.payId}&param=${order.param || ''}&type=${order.type}&price=${price}&reallyPrice=${reallyPrice}&sign=${sign}`;

  return success(`${returnUrl}?${query}`);
}

module.exports = {
  buildOrderId,
  createOrder,
  closeOrder,
  getOrder,
  checkOrder
};

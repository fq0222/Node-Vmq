/**
 * TP-03 共享规则测试
 * 先通过失败测试定义常量、签名、金额和时间工具的目标行为
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PAYMENT_TYPES,
  ORDER_STATES,
  SETTING_KEYS,
  signCreateOrder,
  signCloseOrder,
  signAppHeart,
  signAppPush,
  signNotifyCallback,
  formatAmount,
  addAmountStep,
  subtractAmountStep,
  buildPriceKey,
  isClientTimeSkewValid
} = require('../src');

test('支付方式枚举应与旧系统保持一致', () => {
  assert.deepEqual(PAYMENT_TYPES, {
    WECHAT: 1,
    ALIPAY: 2
  });
});

test('订单状态枚举应与旧系统保持一致', () => {
  assert.deepEqual(ORDER_STATES, {
    EXPIRED: -1,
    PENDING: 0,
    PAID: 1,
    NOTIFY_FAILED: 2
  });
});

test('系统配置键常量应包含核心字段', () => {
  assert.equal(SETTING_KEYS.USER, 'user');
  assert.equal(SETTING_KEYS.KEY, 'key');
  assert.equal(SETTING_KEYS.CLOSE_MINUTES, 'close');
  assert.equal(SETTING_KEYS.WECHAT_QRCODE, 'wxpay');
  assert.equal(SETTING_KEYS.ALIPAY_QRCODE, 'zfbpay');
});

test('创建订单签名应符合 md5(payId + param + type + price + key)', () => {
  assert.equal(
    signCreateOrder({
      payId: 'ORDER_202605250001',
      param: 'user_1001',
      type: 2,
      price: '12.50',
      key: 'abc123'
    }),
    'de2e1ac81150cd04d21dbf303b5a3e0b'
  );
});

test('关闭订单签名应符合 md5(orderId + key)', () => {
  assert.equal(
    signCloseOrder({
      orderId: '202605251010101234',
      key: 'abc123'
    }),
    '3777502de543aa61ce69f67f3f5b0627'
  );
});

test('心跳签名应符合 md5(t + key)', () => {
  assert.equal(
    signAppHeart({
      timestamp: '1779431415000',
      key: 'abc123'
    }),
    '4ca02b6c2c974f4733ca580e729df224'
  );
});

test('推送签名应符合 md5(type + price + t + key)', () => {
  assert.equal(
    signAppPush({
      type: 2,
      price: '12.51',
      timestamp: '1779431415000',
      key: 'abc123'
    }),
    '6024122eac05062b1bb3e801f0898289'
  );
});

test('回调签名应符合 md5(payId + param + type + price + reallyPrice + key)', () => {
  assert.equal(
    signNotifyCallback({
      payId: 'ORDER_202605250001',
      param: 'user_1001',
      type: 2,
      price: '12.50',
      reallyPrice: '12.51',
      key: 'abc123'
    }),
    'a9f64a4c36afd6a2d9eec61bcc303f9b'
  );
});

test('金额格式化应统一输出两位小数', () => {
  assert.equal(formatAmount(12), '12.00');
  assert.equal(formatAmount('12.5'), '12.50');
  assert.equal(formatAmount('12.567'), '12.57');
});

test('金额加减步进应始终按 0.01 精确计算', () => {
  assert.equal(addAmountStep('12.50'), '12.51');
  assert.equal(addAmountStep('0.09'), '0.10');
  assert.equal(subtractAmountStep('12.50'), '12.49');
  assert.equal(subtractAmountStep('0.10'), '0.09');
});

test('金额占位键应按 type-reallyPrice 规范构建', () => {
  assert.equal(buildPriceKey(1, '12.5'), '1-12.50');
  assert.equal(buildPriceKey(2, 8), '2-8.00');
});

test('客户端时间偏差校验应默认以 50 秒为有效阈值', () => {
  assert.equal(isClientTimeSkewValid(1779431415000, 1779431464000), true);
  assert.equal(isClientTimeSkewValid(1779431415000, 1779431465001), false);
});

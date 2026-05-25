/**
 * TP-08 订单核心服务测试
 * 先定义订单主链路行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createOrder,
  closeOrder,
  getOrder,
  checkOrder
} = require('../src/services/order.service');
const { signCreateOrder, signCloseOrder, signNotifyCallback } = require('../../../packages/shared/src');

function createSettingsRepository(overrides = {}) {
  const settings = {
    key: 'secret-key',
    payQf: '1',
    wxpay: 'wxp://general-wechat',
    zfbpay: 'https://qr.example.com/general-alipay',
    close: '5',
    returnUrl: 'https://merchant.example.com/return',
    ...overrides
  };

  return {
    getSettingValue: async (key) => settings[key] ?? null
  };
}

test('创建订单时参数合法应返回成功结果并写入订单', async () => {
  let createdOrder = null;

  const result = await createOrder({
    payId: 'ORDER_001',
    param: 'user_1',
    type: '2',
    price: '12.50',
    notifyUrl: 'https://merchant.example.com/notify',
    returnUrl: 'https://merchant.example.com/return',
    sign: signCreateOrder({
      payId: 'ORDER_001',
      param: 'user_1',
      type: 2,
      price: '12.50',
      key: 'secret-key'
    })
  }, {
    settingsRepository: createSettingsRepository(),
    payOrdersRepository: {
      findByPayId: async () => null,
      createPayOrder: async (payload) => {
        createdOrder = payload;
      }
    },
    tmpPricesRepository: {
      tryReservePriceKey: async (priceKey) => {
        assert.equal(priceKey, '2-12.50');
        return true;
      },
      releasePriceKey: async () => {
        throw new Error('should not release');
      }
    },
    payQrcodeRepository: {
      findByPriceAndType: async () => null
    },
    now: () => 1779431415000,
    randomFourDigits: () => '1234'
  });

  assert.equal(createdOrder.orderId, '202605221430151234');
  assert.equal(createdOrder.payId, 'ORDER_001');
  assert.equal(createdOrder.price, 12.5);
  assert.equal(createdOrder.reallyPrice, 12.5);
  assert.equal(createdOrder.payUrl, 'https://qr.example.com/general-alipay');
  assert.equal(createdOrder.isAuto, 1);
  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: {
      payId: 'ORDER_001',
      orderId: '202605221430151234',
      payType: 2,
      price: 12.5,
      reallyPrice: 12.5,
      payUrl: 'https://qr.example.com/general-alipay',
      isAuto: 1,
      state: 0,
      timeOut: 5,
      date: 1779431415000
    }
  });
});

test('创建订单时命中固定金额二维码应返回固定码并标记 isAuto=0', async () => {
  const result = await createOrder({
    payId: 'ORDER_002',
    param: '',
    type: '1',
    price: '10.00',
    notifyUrl: '',
    returnUrl: '',
    sign: signCreateOrder({
      payId: 'ORDER_002',
      param: '',
      type: 1,
      price: '10.00',
      key: 'secret-key'
    })
  }, {
    settingsRepository: createSettingsRepository({
      wxpay: 'wxp://general-wechat'
    }),
    payOrdersRepository: {
      findByPayId: async () => null,
      createPayOrder: async () => {}
    },
    tmpPricesRepository: {
      tryReservePriceKey: async () => true,
      releasePriceKey: async () => {}
    },
    payQrcodeRepository: {
      findByPriceAndType: async () => ({
        payUrl: 'wxp://fixed-wechat'
      })
    },
    now: () => 1779431415000,
    randomFourDigits: () => '4321'
  });

  assert.equal(result.data.payUrl, 'wxp://fixed-wechat');
  assert.equal(result.data.isAuto, 0);
});

test('创建订单时签名不正确应返回失败', async () => {
  const result = await createOrder({
    payId: 'ORDER_003',
    param: '',
    type: '1',
    price: '10.00',
    notifyUrl: '',
    returnUrl: '',
    sign: 'bad-sign'
  }, {
    settingsRepository: createSettingsRepository(),
    payOrdersRepository: {},
    tmpPricesRepository: {},
    payQrcodeRepository: {}
  });

  assert.deepEqual(result, {
    code: -1,
    msg: '签名校验不通过',
    data: null
  });
});

test('创建订单时商户单号重复应释放占位并返回失败', async () => {
  let releasedPriceKey = null;

  const result = await createOrder({
    payId: 'ORDER_004',
    param: '',
    type: '2',
    price: '9.99',
    notifyUrl: '',
    returnUrl: '',
    sign: signCreateOrder({
      payId: 'ORDER_004',
      param: '',
      type: 2,
      price: '9.99',
      key: 'secret-key'
    })
  }, {
    settingsRepository: createSettingsRepository(),
    payOrdersRepository: {
      findByPayId: async () => ({ id: 10 })
    },
    tmpPricesRepository: {
      tryReservePriceKey: async () => true,
      releasePriceKey: async (priceKey) => {
        releasedPriceKey = priceKey;
      }
    },
    payQrcodeRepository: {
      findByPriceAndType: async () => null
    },
    now: () => 1779431415000,
    randomFourDigits: () => '2222'
  });

  assert.equal(releasedPriceKey, '2-9.99');
  assert.deepEqual(result, {
    code: -1,
    msg: '商户订单号已存在',
    data: null
  });
});

test('创建订单时若初始金额已被占用应按 payQf 递增寻找下一个金额', async () => {
  const triedPriceKeys = [];

  const result = await createOrder({
    payId: 'ORDER_005',
    param: '',
    type: '2',
    price: '12.50',
    notifyUrl: '',
    returnUrl: '',
    sign: signCreateOrder({
      payId: 'ORDER_005',
      param: '',
      type: 2,
      price: '12.50',
      key: 'secret-key'
    })
  }, {
    settingsRepository: createSettingsRepository({
      payQf: '1'
    }),
    payOrdersRepository: {
      findByPayId: async () => null,
      createPayOrder: async () => {}
    },
    tmpPricesRepository: {
      tryReservePriceKey: async (priceKey) => {
        triedPriceKeys.push(priceKey);
        return priceKey === '2-12.51';
      },
      releasePriceKey: async () => {}
    },
    payQrcodeRepository: {
      findByPriceAndType: async () => null
    },
    now: () => 1779431415000,
    randomFourDigits: () => '5678'
  });

  assert.deepEqual(triedPriceKeys, ['2-12.50', '2-12.51']);
  assert.equal(result.data.reallyPrice, 12.51);
});

test('关闭订单时签名正确且状态为待支付应成功关闭', async () => {
  let savedOrder = null;
  let releasedPriceKey = null;

  const result = await closeOrder({
    orderId: 'CLOSE_001',
    sign: signCloseOrder({
      orderId: 'CLOSE_001',
      key: 'secret-key'
    })
  }, {
    settingsRepository: createSettingsRepository(),
    payOrdersRepository: {
      findByOrderId: async () => ({
        id: 1,
        orderId: 'CLOSE_001',
        type: 2,
        reallyPrice: 12.51,
        state: 0
      }),
      savePayOrder: async (payload) => {
        savedOrder = payload;
      }
    },
    tmpPricesRepository: {
      releasePriceKey: async (priceKey) => {
        releasedPriceKey = priceKey;
      }
    },
    now: () => 1779431416000
  });

  assert.equal(releasedPriceKey, '2-12.51');
  assert.equal(savedOrder.state, -1);
  assert.equal(savedOrder.closeDate, 1779431416000);
  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('获取订单详情时应返回兼容结构', async () => {
  const result = await getOrder('ORDER_VIEW_001', {
    settingsRepository: createSettingsRepository({
      close: '8'
    }),
    payOrdersRepository: {
      findByOrderId: async () => ({
        payId: 'PAY_001',
        orderId: 'ORDER_VIEW_001',
        type: 2,
        price: 12.5,
        reallyPrice: 12.51,
        payUrl: 'https://qr.example.com/pay',
        isAuto: 1,
        state: 0,
        createDate: 1779431415000
      })
    }
  });

  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: {
      payId: 'PAY_001',
      orderId: 'ORDER_VIEW_001',
      payType: 2,
      price: 12.5,
      reallyPrice: 12.51,
      payUrl: 'https://qr.example.com/pay',
      isAuto: 1,
      state: 0,
      timeOut: 8,
      date: 1779431415000
    }
  });
});

test('查询订单支付状态时已支付应返回带签名的跳转地址', async () => {
  const result = await checkOrder('ORDER_CHECK_001', {
    settingsRepository: createSettingsRepository({
      returnUrl: 'https://merchant.example.com/return'
    }),
    payOrdersRepository: {
      findByOrderId: async () => ({
        payId: 'PAY_CHECK_001',
        orderId: 'ORDER_CHECK_001',
        param: 'user_8',
        type: 2,
        price: 12.5,
        reallyPrice: 12.51,
        state: 1,
        returnUrl: ''
      })
    }
  });

  const expectedUrl = `https://merchant.example.com/return?payId=PAY_CHECK_001&param=user_8&type=2&price=12.5&reallyPrice=12.51&sign=${signNotifyCallback({
    payId: 'PAY_CHECK_001',
    param: 'user_8',
    type: 2,
    price: '12.5',
    reallyPrice: '12.51',
    key: 'secret-key'
  })}`;

  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: expectedUrl
  });
});

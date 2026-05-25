/**
 * TP-09 监控端兼容服务测试
 * 先定义心跳、推送与状态查询的兼容行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  appHeart,
  appPush,
  getState
} = require('../src/services/monitor.service');
const {
  signAppHeart,
  signAppPush,
  signNotifyCallback
} = require('../../../packages/shared/src');

function createSettingsRepository(overrides = {}) {
  const settings = {
    key: 'secret-key',
    notifyUrl: 'https://merchant.example.com/notify',
    lastheart: '0',
    lastpay: '0',
    jkstate: '0',
    ...overrides
  };

  return {
    getSettingValue: async (key) => settings[key] ?? null,
    saveSettingValue: async (key, value) => {
      settings[key] = value;
    }
  };
}

test('心跳上报成功时应更新 lastheart 与 jkstate', async () => {
  const settingsRepository = createSettingsRepository();

  const result = await appHeart({
    t: '1779431415000',
    sign: signAppHeart({
      timestamp: '1779431415000',
      key: 'secret-key'
    })
  }, {
    settingsRepository,
    now: () => 1779431415000
  });

  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: null
  });
  assert.equal(await settingsRepository.getSettingValue('lastheart'), '1779431415000');
  assert.equal(await settingsRepository.getSettingValue('jkstate'), '1');
});

test('心跳上报时间偏差超过 50 秒时应返回失败', async () => {
  const result = await appHeart({
    t: '1779431415000',
    sign: signAppHeart({
      timestamp: '1779431415000',
      key: 'secret-key'
    })
  }, {
    settingsRepository: createSettingsRepository(),
    now: () => 1779431470001
  });

  assert.deepEqual(result, {
    code: -1,
    msg: '客户端时间错误',
    data: null
  });
});

test('状态查询成功时应返回当前监控状态信息', async () => {
  const result = await getState({
    t: '1779431415000',
    sign: signAppHeart({
      timestamp: '1779431415000',
      key: 'secret-key'
    })
  }, {
    settingsRepository: createSettingsRepository({
      lastheart: '1779431415000',
      lastpay: '1779431415999',
      jkstate: '1'
    })
  });

  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: {
      state: '1',
      lastheart: '1779431415000',
      lastpay: '1779431415999'
    }
  });
});

test('支付推送命中待支付订单且通知成功时应更新订单并释放金额占位', async () => {
  let releasedPriceKey = null;
  let savedOrder = null;
  let fetchUrl = null;

  const result = await appPush({
    type: '2',
    price: '12.51',
    t: '1779431415000',
    sign: signAppPush({
      type: 2,
      price: '12.51',
      timestamp: '1779431415000',
      key: 'secret-key'
    })
  }, {
    settingsRepository: createSettingsRepository({
      notifyUrl: 'https://merchant.example.com/notify'
    }),
    payOrdersRepository: {
      findByPayDate: async () => null,
      findPendingByReallyPriceAndType: async () => ({
        id: 5,
        payId: 'ORDER_PUSH_001',
        orderId: 'VMQ_PUSH_001',
        param: 'user_99',
        type: 2,
        price: 12.5,
        reallyPrice: 12.51,
        notifyUrl: '',
        state: 0
      }),
      savePayOrder: async (payload) => {
        savedOrder = payload;
      },
      updateOrderState: async () => {
        throw new Error('should not update state only');
      },
      createPayOrder: async () => {
        throw new Error('should not create no-order transfer');
      }
    },
    tmpPricesRepository: {
      releasePriceKey: async (priceKey) => {
        releasedPriceKey = priceKey;
      }
    },
    fetchImpl: async (url) => {
      fetchUrl = url;
      return {
        text: async () => 'success'
      };
    },
    now: () => 1779431415001
  });

  assert.equal(releasedPriceKey, '2-12.51');
  assert.equal(savedOrder.state, 1);
  assert.equal(savedOrder.payDate, 1779431415001);
  assert.equal(savedOrder.closeDate, 1779431415001);
  assert.match(fetchUrl, /^https:\/\/merchant\.example\.com\/notify\?/);
  assert.match(fetchUrl, /payId=ORDER_PUSH_001/);
  assert.match(fetchUrl, new RegExp(`sign=${signNotifyCallback({
    payId: 'ORDER_PUSH_001',
    param: 'user_99',
    type: 2,
    price: '12.5',
    reallyPrice: '12.51',
    key: 'secret-key'
  })}`));
  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('支付推送通知失败时应将订单状态置为 2', async () => {
  let stateUpdate = null;

  const result = await appPush({
    type: '1',
    price: '8.88',
    t: '1779431415000',
    sign: signAppPush({
      type: 1,
      price: '8.88',
      timestamp: '1779431415000',
      key: 'secret-key'
    })
  }, {
    settingsRepository: createSettingsRepository({
      notifyUrl: 'https://merchant.example.com/notify'
    }),
    payOrdersRepository: {
      findByPayDate: async () => null,
      findPendingByReallyPriceAndType: async () => ({
        id: 9,
        payId: 'ORDER_PUSH_002',
        orderId: 'VMQ_PUSH_002',
        param: '',
        type: 1,
        price: 8.88,
        reallyPrice: 8.88,
        notifyUrl: '',
        state: 0
      }),
      savePayOrder: async () => {},
      updateOrderState: async (id, state) => {
        stateUpdate = { id, state };
      },
      createPayOrder: async () => {}
    },
    tmpPricesRepository: {
      releasePriceKey: async () => {}
    },
    fetchImpl: async () => ({
      text: async () => 'fail'
    }),
    now: () => 1779431415001
  });

  assert.deepEqual(stateUpdate, {
    id: 9,
    state: 2
  });
  assert.deepEqual(result, {
    code: -1,
    msg: '通知异步地址失败',
    data: null
  });
});

test('支付推送未命中订单时应创建无订单转账记录', async () => {
  let createdOrder = null;

  const result = await appPush({
    type: '2',
    price: '20.00',
    t: '1779431415000',
    sign: signAppPush({
      type: 2,
      price: '20.00',
      timestamp: '1779431415000',
      key: 'secret-key'
    })
  }, {
    settingsRepository: createSettingsRepository(),
    payOrdersRepository: {
      findByPayDate: async () => null,
      findPendingByReallyPriceAndType: async () => null,
      createPayOrder: async (payload) => {
        createdOrder = payload;
      },
      savePayOrder: async () => {},
      updateOrderState: async () => {}
    },
    tmpPricesRepository: {
      releasePriceKey: async () => {}
    },
    fetchImpl: async () => {
      throw new Error('should not notify');
    },
    now: () => 1779431416000
  });

  assert.match(createdOrder.payId, /^无订单转账-/);
  assert.match(createdOrder.orderId, /^无订单转账-/);
  assert.equal(createdOrder.type, 2);
  assert.equal(createdOrder.price, 20);
  assert.equal(createdOrder.reallyPrice, 20);
  assert.equal(createdOrder.state, 1);
  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('支付推送支付时间重复时应拦截重复推送', async () => {
  const result = await appPush({
    type: '2',
    price: '12.51',
    t: '1779431415000',
    sign: signAppPush({
      type: 2,
      price: '12.51',
      timestamp: '1779431415000',
      key: 'secret-key'
    })
  }, {
    settingsRepository: createSettingsRepository(),
    payOrdersRepository: {
      findByPayDate: async () => ({ id: 1 })
    },
    tmpPricesRepository: {
      releasePriceKey: async () => {}
    },
    now: () => 1779431415000
  });

  assert.deepEqual(result, {
    code: -1,
    msg: '重复推送',
    data: null
  });
});

/**
 * TP-10 回调与补单服务测试
 * 先定义分页查询、回调重发与订单清理行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getOrders,
  retryOrderCallback,
  delOrder,
  delGqOrder,
  delLastOrder
} = require('../src/services/callback-admin.service');
const { signNotifyCallback } = require('../../../packages/shared/src');

function createSettingsRepository(overrides = {}) {
  const settings = {
    key: 'secret-key',
    notifyUrl: 'https://merchant.example.com/notify',
    ...overrides
  };

  return {
    getSettingValue: async (key) => settings[key] ?? null
  };
}

test('分页查询订单时应返回旧版分页结构', async () => {
  const result = await getOrders({
    page: '2',
    limit: '10',
    type: '1',
    state: '2'
  }, {
    findOrders: async (payload) => {
      assert.deepEqual(payload, {
        page: 2,
        limit: 10,
        type: 1,
        state: 2
      });

      return {
        count: 3,
        rows: [
          { id: 11 },
          { id: 10 }
        ]
      };
    }
  });

  assert.deepEqual(result, {
    code: 0,
    msg: '',
    count: 3,
    data: [
      { id: 11 },
      { id: 10 }
    ]
  });
});

test('回调重发成功时若订单原为待支付应释放占位并改为已支付', async () => {
  let releasedPriceKey = null;
  let updatedState = null;
  let fetchUrl = null;

  const result = await retryOrderCallback({
    id: '8'
  }, {
    settingsRepository: createSettingsRepository({
      notifyUrl: 'https://merchant.example.com/notify'
    }),
    payOrdersRepository: {
      findById: async (id) => ({
        id,
        payId: 'PAY_RETRY_001',
        orderId: 'ORDER_RETRY_001',
        param: 'user_1',
        type: 2,
        price: 12.5,
        reallyPrice: 12.51,
        notifyUrl: '',
        state: 0
      }),
      updateOrderState: async (id, state) => {
        updatedState = { id, state };
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
    }
  });

  assert.equal(releasedPriceKey, '2-12.51');
  assert.deepEqual(updatedState, {
    id: 8,
    state: 1
  });
  assert.match(fetchUrl, /^https:\/\/merchant\.example\.com\/notify\?/);
  assert.match(fetchUrl, new RegExp(`sign=${signNotifyCallback({
    payId: 'PAY_RETRY_001',
    param: 'user_1',
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

test('回调重发失败时应返回原始失败内容并保持状态不变', async () => {
  let updatedStateCalled = false;

  const result = await retryOrderCallback({
    id: '9'
  }, {
    settingsRepository: createSettingsRepository({
      notifyUrl: 'https://merchant.example.com/notify'
    }),
    payOrdersRepository: {
      findById: async (id) => ({
        id,
        payId: 'PAY_RETRY_002',
        orderId: 'ORDER_RETRY_002',
        param: '',
        type: 1,
        price: 8.88,
        reallyPrice: 8.88,
        notifyUrl: '',
        state: 2
      }),
      updateOrderState: async () => {
        updatedStateCalled = true;
      }
    },
    tmpPricesRepository: {
      releasePriceKey: async () => {}
    },
    fetchImpl: async () => ({
      text: async () => 'fail-message'
    })
  });

  assert.equal(updatedStateCalled, false);
  assert.deepEqual(result, {
    code: -2,
    msg: 'fail-message',
    data: null
  });
});

test('删除单条订单时若订单待支付应先释放占位', async () => {
  let releasedPriceKey = null;
  let deletedId = null;

  const result = await delOrder({
    id: '15'
  }, {
    findById: async (id) => ({
      id,
      type: 1,
      reallyPrice: 10.01,
      state: 0
    }),
    deleteOrderById: async (id) => {
      deletedId = id;
    }
  }, {
    releasePriceKey: async (priceKey) => {
      releasedPriceKey = priceKey;
    }
  });

  assert.equal(releasedPriceKey, '1-10.01');
  assert.equal(deletedId, 15);
  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('批量删除过期订单时应调用按状态删除', async () => {
  let deletedState = null;

  const result = await delGqOrder({
    deleteOrdersByState: async (state) => {
      deletedState = state;
    }
  });

  assert.equal(deletedState, -1);
  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('批量删除旧订单时应删除七天前的记录', async () => {
  let threshold = null;

  const result = await delLastOrder({
    deleteOrdersCreatedBefore: async (timestamp) => {
      threshold = timestamp;
    }
  }, {
    now: () => 1779431415000
  });

  assert.equal(threshold, 1778826615000);
  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: null
  });
});

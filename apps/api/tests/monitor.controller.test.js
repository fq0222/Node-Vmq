/**
 * TP-09 监控端兼容控制器测试
 * 先定义参数提取与 JSON 响应行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  appHeartController,
  appPushController,
  getStateController
} = require('../src/controllers/monitor.controller');

test('心跳控制器应兼容 body 与 query 参数', async () => {
  const req = {
    body: {
      t: '1779431415000'
    },
    query: {
      sign: 'heart-sign'
    }
  };

  let receivedPayload = null;
  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await appHeartController(req, res, {
    appHeart: async (payload) => {
      receivedPayload = payload;
      return {
        code: 1,
        msg: '成功',
        data: null
      };
    }
  });

  assert.deepEqual(receivedPayload, {
    t: '1779431415000',
    sign: 'heart-sign'
  });
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('支付推送控制器应兼容 body 与 query 参数', async () => {
  const req = {
    body: {
      type: '2'
    },
    query: {
      price: '12.51',
      t: '1779431415000',
      sign: 'push-sign'
    }
  };

  let receivedPayload = null;
  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await appPushController(req, res, {
    appPush: async (payload) => {
      receivedPayload = payload;
      return {
        code: 1,
        msg: '成功',
        data: null
      };
    }
  });

  assert.deepEqual(receivedPayload, {
    type: '2',
    price: '12.51',
    t: '1779431415000',
    sign: 'push-sign'
  });
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('状态查询控制器应返回服务层结果', async () => {
  const req = {
    body: {},
    query: {
      t: '1779431415000',
      sign: 'state-sign'
    }
  };

  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await getStateController(req, res, {
    getState: async (payload) => {
      assert.deepEqual(payload, {
        t: '1779431415000',
        sign: 'state-sign'
      });

      return {
        code: 1,
        msg: '成功',
        data: {
          state: '1',
          lastheart: '1',
          lastpay: '2'
        }
      };
    }
  });

  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: {
      state: '1',
      lastheart: '1',
      lastpay: '2'
    }
  });
});

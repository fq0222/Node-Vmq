/**
 * TP-10 回调与补单控制器测试
 * 先定义参数提取与 JSON 响应行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getOrdersController,
  setBdController,
  delOrderController,
  delGqOrderController,
  delLastOrderController
} = require('../src/controllers/callback-admin.controller');

test('订单分页查询控制器应兼容 body 与 query 参数', async () => {
  const req = {
    body: {
      page: '1'
    },
    query: {
      limit: '20',
      type: '2',
      state: '1'
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

  await getOrdersController(req, res, {
    getOrders: async (payload) => {
      receivedPayload = payload;
      return {
        code: 0,
        msg: '',
        count: 0,
        data: []
      };
    }
  });

  assert.deepEqual(receivedPayload, {
    page: '1',
    limit: '20',
    type: '2',
    state: '1'
  });
  assert.deepEqual(jsonPayload, {
    code: 0,
    msg: '',
    count: 0,
    data: []
  });
});

test('补单控制器应返回服务层结果', async () => {
  const req = {
    body: {},
    query: {
      id: '8'
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

  await setBdController(req, res, {
    retryOrderCallback: async (payload) => {
      receivedPayload = payload;
      return {
        code: 1,
        msg: '成功',
        data: null
      };
    }
  });

  assert.deepEqual(receivedPayload, {
    id: '8'
  });
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('删除订单控制器应返回服务层结果', async () => {
  const req = {
    body: {
      id: '15'
    },
    query: {}
  };

  let receivedPayload = null;
  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await delOrderController(req, res, {
    delOrder: async (payload) => {
      receivedPayload = payload;
      return {
        code: 1,
        msg: '成功',
        data: null
      };
    }
  });

  assert.deepEqual(receivedPayload, {
    id: '15'
  });
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('批量删除过期订单控制器应返回服务层结果', async () => {
  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await delGqOrderController({
    body: {},
    query: {}
  }, res, {
    delGqOrder: async () => ({
      code: 1,
      msg: '成功',
      data: null
    })
  });

  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('批量删除旧订单控制器应返回服务层结果', async () => {
  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await delLastOrderController({
    body: {},
    query: {}
  }, res, {
    delLastOrder: async () => ({
      code: 1,
      msg: '成功',
      data: null
    })
  });

  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

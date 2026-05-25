/**
 * TP-08 订单核心控制器测试
 * 先定义订单接口的参数提取与响应行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createOrderController,
  getOrderController,
  checkOrderController,
  closeOrderController
} = require('../src/controllers/order.controller');

test('创建订单控制器在 isHtml=1 时应返回兼容跳转脚本', async () => {
  const req = {
    body: {
      payId: 'PAY_HTML_001',
      type: '2',
      price: '12.50',
      isHtml: '1'
    },
    query: {}
  };

  let contentTypeValue = null;
  let sentHtml = null;

  const res = {
    type(value) {
      contentTypeValue = value;
      return this;
    },
    send(payload) {
      sentHtml = payload;
      return this;
    }
  };

  await createOrderController(req, res, {
    createOrder: async () => ({
      code: 1,
      msg: '成功',
      data: {
        orderId: 'ORDER_HTML_001'
      }
    })
  });

  assert.equal(contentTypeValue, 'html');
  assert.equal(sentHtml, "<script>window.location.href = '/payPage/pay.html?orderId=ORDER_HTML_001'</script>");
});

test('创建订单控制器在 isHtml!=1 时应返回 JSON', async () => {
  const req = {
    body: {
      payId: 'PAY_JSON_001'
    },
    query: {
      type: '1',
      price: '10.00'
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

  await createOrderController(req, res, {
    createOrder: async (payload) => {
      receivedPayload = payload;
      return {
        code: 1,
        msg: '成功',
        data: {
          orderId: 'ORDER_JSON_001'
        }
      };
    }
  });

  assert.equal(receivedPayload.payId, 'PAY_JSON_001');
  assert.equal(receivedPayload.type, '1');
  assert.equal(receivedPayload.price, '10.00');
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: {
      orderId: 'ORDER_JSON_001'
    }
  });
});

test('获取订单控制器应返回服务层结果', async () => {
  const req = {
    body: {},
    query: {
      orderId: 'ORDER_QUERY_001'
    }
  };

  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await getOrderController(req, res, {
    getOrder: async (orderId) => {
      assert.equal(orderId, 'ORDER_QUERY_001');
      return {
        code: 1,
        msg: '成功',
        data: null
      };
    }
  });

  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('关闭订单控制器应兼容 body 和 query 参数', async () => {
  const req = {
    body: {
      orderId: 'ORDER_CLOSE_001'
    },
    query: {
      sign: 'sign-001'
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

  await closeOrderController(req, res, {
    closeOrder: async (payload) => {
      receivedPayload = payload;
      return {
        code: 1,
        msg: '成功',
        data: null
      };
    }
  });

  assert.deepEqual(receivedPayload, {
    orderId: 'ORDER_CLOSE_001',
    sign: 'sign-001'
  });
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

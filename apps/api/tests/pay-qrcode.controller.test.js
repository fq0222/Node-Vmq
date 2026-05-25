/**
 * TP-07 固定金额二维码控制器测试
 * 先定义控制器的参数提取与响应行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getPayQrcodesController,
  addPayQrcodeController,
  delPayQrcodeController
} = require('../src/controllers/pay-qrcode.controller');

test('新增固定金额二维码控制器应兼容 body 和 query 参数', async () => {
  const req = {
    body: {
      payUrl: 'wxp://body',
      price: '10.01'
    },
    query: {
      type: '1'
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

  await addPayQrcodeController(req, res, {
    addPayQrcode: async (payload) => {
      receivedPayload = payload;
      return {
        code: 1,
        msg: '成功',
        data: null
      };
    }
  });

  assert.deepEqual(receivedPayload, {
    payUrl: 'wxp://body',
    price: '10.01',
    type: '1'
  });
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('分页查询固定金额二维码控制器应返回服务层结果', async () => {
  const req = {
    body: {},
    query: {
      page: '1',
      limit: '10',
      type: '2'
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

  await getPayQrcodesController(req, res, {
    getPayQrcodes: async (payload) => {
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
    limit: '10',
    type: '2'
  });
  assert.deepEqual(jsonPayload, {
    code: 0,
    msg: '',
    count: 0,
    data: []
  });
});

test('删除固定金额二维码控制器应返回服务层结果', async () => {
  const req = {
    body: {},
    query: {
      id: '5'
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

  await delPayQrcodeController(req, res, {
    delPayQrcode: async (payload) => {
      receivedPayload = payload;
      return {
        code: 1,
        msg: '成功',
        data: null
      };
    }
  });

  assert.deepEqual(receivedPayload, {
    id: '5'
  });
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

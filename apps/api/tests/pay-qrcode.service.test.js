/**
 * TP-07 固定金额二维码服务测试
 * 先定义固定金额二维码管理行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  addPayQrcode,
  getPayQrcodes,
  delPayQrcode
} = require('../src/services/pay-qrcode.service');

test('新增固定金额二维码时参数合法应保存成功', async () => {
  let savedPayload = null;

  const result = await addPayQrcode({
    payUrl: 'wxp://f2f0abc1234567890',
    price: '12.51',
    type: '1'
  }, {
    createPayQrcode: async (payload) => {
      savedPayload = payload;
    }
  });

  assert.deepEqual(savedPayload, {
    payUrl: 'wxp://f2f0abc1234567890',
    price: 12.51,
    type: 1
  });
  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('新增固定金额二维码时缺少 payUrl 应返回失败', async () => {
  const result = await addPayQrcode({
    payUrl: '',
    price: '12.51',
    type: '1'
  }, {
    createPayQrcode: async () => {
      throw new Error('should not call');
    }
  });

  assert.deepEqual(result, {
    code: -1,
    msg: '失败',
    data: null
  });
});

test('新增固定金额二维码时 price=0 应返回失败', async () => {
  const result = await addPayQrcode({
    payUrl: 'wxp://f2f0abc1234567890',
    price: '0',
    type: '1'
  }, {
    createPayQrcode: async () => {
      throw new Error('should not call');
    }
  });

  assert.deepEqual(result, {
    code: -1,
    msg: '失败',
    data: null
  });
});

test('新增固定金额二维码时 type=0 应返回失败', async () => {
  const result = await addPayQrcode({
    payUrl: 'wxp://f2f0abc1234567890',
    price: '12.51',
    type: '0'
  }, {
    createPayQrcode: async () => {
      throw new Error('should not call');
    }
  });

  assert.deepEqual(result, {
    code: -1,
    msg: '失败',
    data: null
  });
});

test('分页查询固定金额二维码时应返回旧版分页结构', async () => {
  const result = await getPayQrcodes({
    page: '1',
    limit: '20',
    type: '2'
  }, {
    findPayQrcodes: async (query) => {
      assert.deepEqual(query, {
        page: 1,
        limit: 20,
        type: 2
      });

      return {
        count: 2,
        rows: [
          { id: 2, payUrl: 'a', price: 11.11, type: 2 },
          { id: 1, payUrl: 'b', price: 22.22, type: 2 }
        ]
      };
    }
  });

  assert.deepEqual(result, {
    code: 0,
    msg: '',
    count: 2,
    data: [
      { id: 2, payUrl: 'a', price: 11.11, type: 2 },
      { id: 1, payUrl: 'b', price: 22.22, type: 2 }
    ]
  });
});

test('删除固定金额二维码时应按 id 删除并返回成功', async () => {
  let deletedId = null;

  const result = await delPayQrcode({
    id: '3'
  }, {
    deletePayQrcodeById: async (id) => {
      deletedId = id;
    }
  });

  assert.equal(deletedId, 3);
  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: null
  });
});

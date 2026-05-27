/**
 * 二维码控制器测试。
 * 约束二维码接口的参数提取、成功响应与失败信息透传行为。
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  enQrcodeController,
  deQrcodeController,
  deQrcode2Controller
} = require('../src/controllers/qrcode.controller');

test('生成二维码接口应输出 PNG 响应', async () => {
  const req = {
    query: {
      url: 'https://example.com/pay/123'
    }
  };

  let contentTypeValue = null;
  let sentBuffer = null;

  const res = {
    type(value) {
      contentTypeValue = value;
      return this;
    },
    send(payload) {
      sentBuffer = payload;
      return this;
    }
  };

  await enQrcodeController(req, res, {
    createQrPngBuffer: async (url) => {
      assert.equal(url, 'https://example.com/pay/123');
      return Buffer.from('png-data');
    }
  });

  assert.equal(contentTypeValue, 'png');
  assert.deepEqual(sentBuffer, Buffer.from('png-data'));
});

test('解析 base64 接口应返回成功结果', async () => {
  const req = {
    body: {
      base64: 'abc'
    },
    query: {}
  };

  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await deQrcodeController(req, res, {
    decodeQrFromBase64: async (base64) => {
      assert.equal(base64, 'abc');
      return 'decoded-text';
    }
  });

  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: 'decoded-text'
  });
});

test('解析上传文件接口应返回成功结果', async () => {
  const req = {
    file: {
      buffer: Buffer.from('file-data')
    }
  };

  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await deQrcode2Controller(req, res, {
    decodeQrFromFileBuffer: async (buffer) => {
      assert.deepEqual(buffer, Buffer.from('file-data'));
      return 'decoded-file-text';
    }
  });

  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: 'decoded-file-text'
  });
});

test('解析上传文件接口失败时应透传详细失败原因', async () => {
  const req = {
    file: {
      buffer: Buffer.from('file-data')
    }
  };

  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await deQrcode2Controller(req, res, {
    decodeQrFromFileBuffer: async () => {
      throw new Error('二维码解析失败，已尝试5种图像方案');
    }
  });

  assert.deepEqual(jsonPayload, {
    code: -1,
    msg: '二维码解析失败，已尝试5种图像方案',
    data: null
  });
});

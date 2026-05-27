/**
 * 二维码管理服务测试文件
 * 负责验证固定金额二维码列表查询、新增、删除、解析与预览地址生成行为。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPayQrcodePreviewUrl,
  createPayQrcode,
  decodePayQrcodeFile,
  deletePayQrcode,
  fetchPayQrcodePage
} from '../src/services/qrcode-admin-service.js';

test('二维码列表查询应通过 query string 调用 /admin/getPayQrcodes 并映射结果', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {
      code: 0,
      msg: '',
      count: 2,
      data: [
        {
          id: 101,
          pay_url: 'wxp://pay-1',
          price: 18.8,
          type: 1
        },
        {
          id: 102,
          pay_url: 'alipay://pay-2',
          price: '30.00',
          type: '2'
        }
      ]
    };
  };

  const result = await fetchPayQrcodePage(
    {
      page: 3,
      limit: 15,
      type: '2'
    },
    request
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/admin/getPayQrcodes?page=3&limit=15&type=2');
  assert.deepEqual(calls[0].options, {
    method: 'GET'
  });
  assert.deepEqual(result, {
    ok: true,
    message: '',
    count: 2,
    rows: [
      {
        id: 101,
        payUrl: 'wxp://pay-1',
        price: 18.8,
        type: 1
      },
      {
        id: 102,
        payUrl: 'alipay://pay-2',
        price: '30.00',
        type: '2'
      }
    ]
  });
});

test('二维码列表查询在 page 和 limit 为空字符串时应回退默认值', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {
      code: 0,
      msg: '',
      count: 0,
      data: []
    };
  };

  const result = await fetchPayQrcodePage(
    {
      page: '',
      limit: '',
      type: ''
    },
    request
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/admin/getPayQrcodes?page=1&limit=20');
  assert.deepEqual(result, {
    ok: true,
    message: '',
    count: 0,
    rows: []
  });
});

test('新增二维码应提交到 /admin/addPayQrcode 并返回统一结果', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {
      code: 1,
      msg: '添加成功',
      data: null
    };
  };

  const payload = {
    payUrl: 'wxp://pay-demo',
    price: '12.30',
    type: '1'
  };

  const result = await createPayQrcode(payload, request);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/admin/addPayQrcode');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(calls[0].options.body, payload);
  assert.deepEqual(result, {
    ok: true,
    message: '添加成功'
  });
});

test('删除二维码应提交到 /admin/delPayQrcode 并返回统一结果', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {
      code: 1,
      msg: '删除成功',
      data: null
    };
  };

  const result = await deletePayQrcode({ id: 88 }, request);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/admin/delPayQrcode');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(calls[0].options.body, {
    id: 88
  });
  assert.deepEqual(result, {
    ok: true,
    message: '删除成功'
  });
});

test('二维码图片解析应通过 multipart 调用 /deQrcode2 并返回统一结果', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {
      code: 1,
      msg: '解析成功',
      data: 'wxp://decoded-text'
    };
  };

  const fakeFile = new File(['image-bytes'], 'wechat-pay.png', {
    type: 'image/png'
  });

  const result = await decodePayQrcodeFile(fakeFile, request);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/deQrcode2');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.body instanceof FormData, true);
  assert.equal(calls[0].options.body.get('file').name, fakeFile.name);
  assert.deepEqual(result, {
    ok: true,
    message: '解析成功',
    text: 'wxp://decoded-text'
  });
});

test('二维码预览地址应拼接 /enQrcode 接口', () => {
  const result = buildPayQrcodePreviewUrl('wxp://preview-demo');
  const previewUrl = new URL(result);

  assert.equal(previewUrl.pathname, '/enQrcode');
  assert.equal(previewUrl.searchParams.get('url'), 'wxp://preview-demo');
});

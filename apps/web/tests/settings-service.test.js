/**
 * 系统设置服务测试文件
 * 负责验证设置读取、保存、二维码解析和预览地址生成行为。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQrcodePreviewUrl,
  decodeQrcodeFromFile,
  fetchSettings,
  saveSettings
} from '../src/services/settings-service.js';

test('读取系统设置应请求 /admin/getSettings', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {
      code: 1,
      msg: '成功',
      data: {
        user: 'admin'
      }
    };
  };

  const result = await fetchSettings(request);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/admin/getSettings');
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(result.user, 'admin');
});

test('保存系统设置应请求 /admin/saveSetting', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {
      code: 1,
      msg: '成功',
      data: null
    };
  };

  const payload = {
    user: 'admin',
    key: 'merchant-key'
  };

  const result = await saveSettings(payload, request);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/admin/saveSetting');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(calls[0].options.body, payload);
  assert.equal(result.ok, true);
});

test('二维码文件解析应提交 multipart 请求到 /deQrcode2', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {
      code: 1,
      msg: '成功',
      data: 'wxp://qrcode-result'
    };
  };

  const fakeFile = {
    name: 'qrcode.png'
  };

  const result = await decodeQrcodeFromFile(fakeFile, request);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/deQrcode2');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.body instanceof FormData, true);
  assert.equal(result.text, 'wxp://qrcode-result');
});

test('二维码预览地址应拼接 enQrcode 接口', () => {
  const result = buildQrcodePreviewUrl('wxp://demo');

  assert.equal(
    result,
    'http://localhost:3000/enQrcode?url=wxp%3A%2F%2Fdemo'
  );
});

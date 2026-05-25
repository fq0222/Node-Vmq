/**
 * TP-06 二维码服务测试
 * 先定义二维码生成与解析行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const QRCode = require('qrcode');

const {
  createQrPngBuffer,
  decodeQrFromBase64,
  decodeQrFromFileBuffer
} = require('../src/services/qrcode.service');

test('生成二维码时应返回 PNG 二进制数据', async () => {
  const buffer = await createQrPngBuffer('https://example.com/pay/123');

  assert.equal(Buffer.isBuffer(buffer), true);
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});

test('解析 base64 二维码时应返回二维码文本', async () => {
  const pngDataUrl = await QRCode.toDataURL('TP-06-BASE64', {
    width: 200,
    margin: 1
  });
  const pngBase64 = pngDataUrl.split(',')[1];

  const text = await decodeQrFromBase64(pngBase64);

  assert.equal(text, 'TP-06-BASE64');
});

test('解析上传文件二维码时应返回二维码文本', async () => {
  const pngBuffer = await QRCode.toBuffer('TP-06-FILE', {
    width: 200,
    margin: 1,
    type: 'png'
  });

  const text = await decodeQrFromFileBuffer(pngBuffer);

  assert.equal(text, 'TP-06-FILE');
});

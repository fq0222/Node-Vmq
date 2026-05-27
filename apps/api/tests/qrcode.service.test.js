/**
 * 二维码服务测试。
 * 先定义二维码生成与解析的核心行为，再约束复杂海报场景下的解码能力。
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const QRCode = require('qrcode');
const { Jimp } = require('jimp');

const {
  createQrPngBuffer,
  decodeQrFromBase64,
  decodeQrFromFileBuffer
} = require('../src/services/qrcode.service');

/**
 * 生成接近收款海报样式的二维码图片，用于回归测试复杂场景的解码能力。
 * @param {string} text - 二维码文本
 * @returns {Promise<Buffer>} 海报样式 PNG 图像
 */
async function createPosterQrBuffer(text) {
  const qrSize = 260;
  const qrBuffer = await QRCode.toBuffer(text, {
    width: qrSize,
    margin: 2,
    type: 'png',
    errorCorrectionLevel: 'H'
  });
  const qrImage = await Jimp.read(qrBuffer);
  const logoSize = Math.floor(qrSize * 0.24);
  const logoImage = new Jimp({
    width: logoSize,
    height: logoSize,
    color: 0xff8844ff
  });

  qrImage.composite(
    logoImage,
    Math.floor((qrSize - logoSize) / 2),
    Math.floor((qrSize - logoSize) / 2)
  );

  const posterImage = new Jimp({
    width: 1080,
    height: 2400,
    color: 0x11c464ff
  });
  const cardImage = new Jimp({
    width: 660,
    height: 920,
    color: 0xffffffff
  });

  posterImage.composite(cardImage, 210, 180);
  posterImage.composite(qrImage, Math.floor((1080 - qrSize) / 2), 470);

  return posterImage.getBuffer('image/png');
}

/**
 * 生成 qrcode-reader 无法稳定识别、但更强解码器可以识别的复杂海报二维码。
 * 该样本用于约束服务层必须具备兜底解码能力。
 * @param {string} text - 二维码文本
 * @returns {Promise<Buffer>} 海报样式 PNG 图像
 */
async function createFallbackPosterQrBuffer(text) {
  const qrSize = 210;
  const qrBuffer = await QRCode.toBuffer(text, {
    width: qrSize,
    margin: 2,
    type: 'png',
    errorCorrectionLevel: 'H'
  });
  const qrImage = await Jimp.read(qrBuffer);
  const logoSize = Math.floor(qrSize * 0.26);
  const logoImage = new Jimp({
    width: logoSize,
    height: logoSize,
    color: 0xff8844ff
  });
  const posterImage = new Jimp({
    width: 1080,
    height: 1383,
    color: 0x11c464ff
  });
  const cardImage = new Jimp({
    width: 640,
    height: 860,
    color: 0xffffffff
  });

  qrImage.composite(
    logoImage,
    Math.floor((qrSize - logoSize) / 2),
    Math.floor((qrSize - logoSize) / 2)
  );
  posterImage.composite(cardImage, 220, 230);
  posterImage.composite(qrImage, Math.floor((1080 - qrSize) / 2), 430);

  return posterImage.getBuffer('image/png');
}

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

test('解析海报样式二维码时应返回二维码文本', async () => {
  const posterBuffer = await createPosterQrBuffer('wxp://sample-260-2400');

  const text = await decodeQrFromFileBuffer(posterBuffer);

  assert.equal(text, 'wxp://sample-260-2400');
});

test('解析更复杂的海报样式二维码时应通过兜底解码器返回文本', async () => {
  const posterBuffer = await createFallbackPosterQrBuffer('wxp://p-210-0.26-1383');

  const text = await decodeQrFromFileBuffer(posterBuffer);

  assert.equal(text, 'wxp://p-210-0.26-1383');
});

test('解析真实微信收款码样本时应返回二维码文本', async (context) => {
  const fixturePath = 'F:\\FQ\\图片\\收款码\\微信10.02元码.png';

  if (!fs.existsSync(fixturePath)) {
    context.skip('未提供真实微信收款码样本，跳过本地回归测试');
    return;
  }

  const text = await decodeQrFromFileBuffer(fs.readFileSync(fixturePath));

  assert.match(text, /^wxp:\/\//);
});

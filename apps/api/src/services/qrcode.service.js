/**
 * 二维码服务模块
 * 负责二维码生成与解析，保持与原项目接口行为兼容
 */

const QRCode = require('qrcode');
const { Jimp } = require('jimp');
const QrCodeReader = require('qrcode-reader');
const { createLogger } = require('../utils/logger');

const logger = createLogger('api:service:qrcode');

/**
 * 生成二维码 PNG 二进制数据
 * @param {string} url - 二维码内容
 * @returns {Promise<Buffer>} PNG 二进制缓冲区
 */
async function createQrPngBuffer(url) {
  logger.info('开始生成二维码 PNG 数据');

  const buffer = await QRCode.toBuffer(String(url || ''), {
    width: 200,
    margin: 1,
    type: 'png'
  });

  logger.info(`二维码 PNG 数据生成完成，长度=${buffer.length}`);
  return buffer;
}

/**
 * 从图片缓冲区解析二维码内容
 * @param {Buffer} imageBuffer - 图片二进制数据
 * @returns {Promise<string>} 二维码文本
 */
async function decodeQrFromImageBuffer(imageBuffer) {
  logger.info('开始解析二维码图片数据');

  const image = await Jimp.read(imageBuffer);
  const reader = new QrCodeReader();

  return new Promise((resolve, reject) => {
    reader.callback = (error, result) => {
      if (error) {
        logger.error(`二维码解析失败：${error.message}`);
        reject(error);
        return;
      }

      const text = result?.result;
      logger.info(`二维码解析成功，text=${text}`);
      resolve(text);
    };

    // qrcode-reader 依赖位图数据，因此这里直接传入 Jimp bitmap
    reader.decode(image.bitmap);
  });
}

/**
 * 从 base64 图片内容解析二维码
 * @param {string} base64 - base64 图片内容
 * @returns {Promise<string>} 二维码文本
 */
async function decodeQrFromBase64(base64) {
  logger.info('开始解析 base64 二维码');

  const imageBuffer = Buffer.from(String(base64 || ''), 'base64');
  return decodeQrFromImageBuffer(imageBuffer);
}

/**
 * 从上传文件缓冲区解析二维码
 * @param {Buffer} fileBuffer - 上传文件二进制数据
 * @returns {Promise<string>} 二维码文本
 */
async function decodeQrFromFileBuffer(fileBuffer) {
  logger.info('开始解析上传文件二维码');
  return decodeQrFromImageBuffer(fileBuffer);
}

module.exports = {
  createQrPngBuffer,
  decodeQrFromBase64,
  decodeQrFromFileBuffer
};

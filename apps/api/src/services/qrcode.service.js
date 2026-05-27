/**
 * 二维码服务模块。
 * 负责二维码生成与解析，并通过多轮图像预处理增强复杂海报场景下的解码成功率。
 */

const QRCode = require('qrcode');
const { Jimp } = require('jimp');
const jsQR = require('jsqr');
const QrCodeReader = require('qrcode-reader');
const { createLogger } = require('../utils/logger');

const logger = createLogger('api:service:qrcode');

/**
 * 生成二维码 PNG 二进制数据。
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
 * 统一提取错误信息，避免日志中出现 undefined。
 * @param {unknown} error - 原始错误对象
 * @returns {string} 可读错误信息
 */
function getErrorMessage(error) {
  if (!error) {
    return '未知错误';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error.message === 'string' && error.message) {
    return error.message;
  }

  return String(error);
}

/**
 * 使用 qrcode-reader 解码位图。
 * @param {import('jimp').Bitmap} bitmap - Jimp 位图数据
 * @param {string} label - 当前尝试标签
 * @returns {Promise<string>} 二维码文本
 */
function decodeBitmap(bitmap, label) {
  logger.info(`开始尝试二维码解码，label=${label}，width=${bitmap.width}，height=${bitmap.height}`);

  return new Promise((resolve, reject) => {
    const reader = new QrCodeReader();

    reader.callback = (error, result) => {
      if (error) {
        const message = getErrorMessage(error);
        logger.warn(`二维码解码尝试失败，label=${label}，message=${message}`);
        reject(new Error(message));
        return;
      }

      const text = result?.result;

      if (!text) {
        logger.warn(`二维码解码尝试失败，label=${label}，message=未读取到二维码文本`);
        reject(new Error('未读取到二维码文本'));
        return;
      }

      logger.info(`二维码解码尝试成功，label=${label}，text=${text}`);
      resolve(text);
    };

    try {
      reader.decode(bitmap);
    } catch (error) {
      const message = getErrorMessage(error);
      logger.warn(`二维码解码执行异常，label=${label}，message=${message}`);
      reject(new Error(message));
    }
  });
}

/**
 * 使用 jsQR 对位图进行兜底解码。
 * 当 qrcode-reader 无法识别复杂美化码时，使用更强的像素级解码器继续尝试。
 * @param {import('jimp').Bitmap} bitmap - Jimp 位图数据
 * @param {string} label - 当前尝试标签
 * @returns {string} 二维码文本
 */
function decodeBitmapWithJsqr(bitmap, label) {
  logger.info(`开始尝试 jsQR 兜底解码，label=${label}，width=${bitmap.width}，height=${bitmap.height}`);

  const result = jsQR(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height, {
    inversionAttempts: 'attemptBoth'
  });

  if (!result?.data) {
    logger.warn(`jsQR 兜底解码失败，label=${label}，message=未识别到二维码文本`);
    throw new Error('未识别到二维码文本');
  }

  logger.info(`jsQR 兜底解码成功，label=${label}，text=${result.data}`);
  return result.data;
}

/**
 * 构造二维码解析候选图像列表。
 * 原图优先，后续再尝试更适合海报/美化码的缩放与灰度增强版本。
 * @param {Jimp} image - 原始图像
 * @returns {Array<{ label: string, image: Jimp }>} 候选图像列表
 */
function createDecodeCandidates(image) {
  return [
    {
      label: 'original',
      image: image.clone()
    },
    {
      label: 'resize-768-gray',
      image: image
        .clone()
        .resize({ w: 768, h: Jimp.AUTO })
        .greyscale()
        .contrast(0.4)
    },
    {
      label: 'resize-512-gray',
      image: image
        .clone()
        .resize({ w: 512, h: Jimp.AUTO })
        .greyscale()
        .contrast(0.5)
    },
    {
      label: 'resize-1024-gray',
      image: image
        .clone()
        .resize({ w: 1024, h: Jimp.AUTO })
        .greyscale()
        .contrast(0.35)
    }
  ];
}

/**
 * 从图片缓冲区解析二维码内容。
 * @param {Buffer} imageBuffer - 图片二进制数据
 * @returns {Promise<string>} 二维码文本
 */
async function decodeQrFromImageBuffer(imageBuffer) {
  logger.info('开始解析二维码图片数据');

  const image = await Jimp.read(imageBuffer);
  logger.info(`二维码图片读取完成，width=${image.bitmap.width}，height=${image.bitmap.height}`);

  const candidates = createDecodeCandidates(image);
  const readerErrors = [];

  for (const candidate of candidates) {
    try {
      return await decodeBitmap(candidate.image.bitmap, candidate.label);
    } catch (error) {
      const message = getErrorMessage(error);
      readerErrors.push(`${candidate.label}:${message}`);
    }
  }

  const jsqrErrors = [];

  for (const candidate of candidates) {
    try {
      return decodeBitmapWithJsqr(candidate.image.bitmap, candidate.label);
    } catch (error) {
      const message = getErrorMessage(error);
      jsqrErrors.push(`${candidate.label}:${message}`);
    }
  }

  const errorMessage = `二维码解析失败，qrcode-reader尝试=${readerErrors.join(' | ')}，jsQR尝试=${jsqrErrors.join(' | ')}`;
  logger.error(errorMessage);
  throw new Error(errorMessage);
}

/**
 * 从 base64 图片内容解析二维码。
 * @param {string} base64 - base64 图片内容
 * @returns {Promise<string>} 二维码文本
 */
async function decodeQrFromBase64(base64) {
  logger.info('开始解析 base64 二维码');

  const imageBuffer = Buffer.from(String(base64 || ''), 'base64');
  return decodeQrFromImageBuffer(imageBuffer);
}

/**
 * 从上传文件缓冲区解析二维码。
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

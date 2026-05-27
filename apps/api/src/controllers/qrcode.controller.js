/**
 * 二维码控制器模块。
 * 负责二维码工具接口的参数提取与响应组装，并透传可读错误信息便于前端排查。
 */

const { createLogger } = require('../utils/logger');
const { success, error } = require('../utils/response');
const {
  createQrPngBuffer: defaultCreateQrPngBuffer,
  decodeQrFromBase64: defaultDecodeQrFromBase64,
  decodeQrFromFileBuffer: defaultDecodeQrFromFileBuffer
} = require('../services/qrcode.service');

const logger = createLogger('api:controller:qrcode');

/**
 * 统一提取控制器捕获到的错误信息。
 * @param {unknown} caughtError - 捕获到的异常
 * @param {string} fallbackMessage - 兜底提示文案
 * @returns {string} 可返回给前端的错误信息
 */
function resolveDecodeErrorMessage(caughtError, fallbackMessage) {
  if (caughtError instanceof Error && caughtError.message) {
    return caughtError.message;
  }

  if (typeof caughtError?.message === 'string' && caughtError.message) {
    return caughtError.message;
  }

  return fallbackMessage;
}

/**
 * 生成二维码接口控制器。
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{createQrPngBuffer?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function enQrcodeController(req, res, deps = {}) {
  logger.info('收到生成二维码请求');

  const createQrPngBuffer = deps.createQrPngBuffer || defaultCreateQrPngBuffer;
  const url = req.query?.url || req.body?.url || '';
  const buffer = await createQrPngBuffer(url);

  res.type('png').send(buffer);
}

/**
 * 解析 base64 二维码接口控制器。
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{decodeQrFromBase64?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function deQrcodeController(req, res, deps = {}) {
  logger.info('收到 base64 二维码解析请求');

  const decodeQrFromBase64 = deps.decodeQrFromBase64 || defaultDecodeQrFromBase64;
  const base64 = req.body?.base64 || req.query?.base64 || '';

  try {
    const text = await decodeQrFromBase64(base64);
    res.json(success(text));
  } catch (decodeError) {
    const message = resolveDecodeErrorMessage(decodeError, '二维码解析失败');
    logger.warn(`base64 二维码解析失败：${message}`);
    res.json(error(message));
  }
}

/**
 * 解析上传文件二维码接口控制器。
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{decodeQrFromFileBuffer?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function deQrcode2Controller(req, res, deps = {}) {
  logger.info('收到上传文件二维码解析请求');

  const decodeQrFromFileBuffer = deps.decodeQrFromFileBuffer || defaultDecodeQrFromFileBuffer;

  try {
    const text = await decodeQrFromFileBuffer(req.file?.buffer);
    res.json(success(text));
  } catch (decodeError) {
    const message = resolveDecodeErrorMessage(decodeError, '二维码解析失败');
    logger.warn(`上传文件二维码解析失败：${message}`);
    res.json(error(message));
  }
}

module.exports = {
  enQrcodeController,
  deQrcodeController,
  deQrcode2Controller
};

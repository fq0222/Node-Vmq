/**
 * 固定金额二维码控制器模块
 * 负责固定金额二维码管理接口的参数提取与响应编排
 */

const { createLogger } = require('../utils/logger');
const { createPayQrcodeRepository } = require('../repositories/pay-qrcode.repository');
const {
  addPayQrcode: defaultAddPayQrcode,
  getPayQrcodes: defaultGetPayQrcodes,
  delPayQrcode: defaultDelPayQrcode
} = require('../services/pay-qrcode.service');

const logger = createLogger('api:controller:pay-qrcode');

/**
 * 提取固定金额二维码新增参数
 * @param {import('express').Request} req - 请求对象
 * @returns {{payUrl?: string, price?: string, type?: string}} 参数对象
 */
function getAddPayQrcodePayload(req) {
  return {
    payUrl: req.body?.payUrl || req.query?.payUrl,
    price: req.body?.price || req.query?.price,
    type: req.body?.type || req.query?.type
  };
}

/**
 * 提取固定金额二维码分页参数
 * @param {import('express').Request} req - 请求对象
 * @returns {{page?: string, limit?: string, type?: string}} 参数对象
 */
function getPayQrcodeListPayload(req) {
  return {
    page: req.body?.page || req.query?.page,
    limit: req.body?.limit || req.query?.limit,
    type: req.body?.type || req.query?.type
  };
}

/**
 * 提取固定金额二维码删除参数
 * @param {import('express').Request} req - 请求对象
 * @returns {{id?: string}} 参数对象
 */
function getDelPayQrcodePayload(req) {
  return {
    id: req.body?.id || req.query?.id
  };
}

/**
 * 新增固定金额二维码控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{addPayQrcode?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function addPayQrcodeController(req, res, deps = {}) {
  logger.info('收到新增固定金额二维码请求');

  const addPayQrcode = deps.addPayQrcode || defaultAddPayQrcode;
  const payload = getAddPayQrcodePayload(req);

  let result;
  if (deps.addPayQrcode) {
    result = await addPayQrcode(payload);
  } else {
    const repository = createPayQrcodeRepository(req.app.locals.db);
    result = await addPayQrcode(payload, repository);
  }

  res.json(result);
}

/**
 * 分页查询固定金额二维码控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{getPayQrcodes?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function getPayQrcodesController(req, res, deps = {}) {
  logger.info('收到分页查询固定金额二维码请求');

  const getPayQrcodes = deps.getPayQrcodes || defaultGetPayQrcodes;
  const payload = getPayQrcodeListPayload(req);

  let result;
  if (deps.getPayQrcodes) {
    result = await getPayQrcodes(payload);
  } else {
    const repository = createPayQrcodeRepository(req.app.locals.db);
    result = await getPayQrcodes(payload, repository);
  }

  res.json(result);
}

/**
 * 删除固定金额二维码控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{delPayQrcode?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function delPayQrcodeController(req, res, deps = {}) {
  logger.info('收到删除固定金额二维码请求');

  const delPayQrcode = deps.delPayQrcode || defaultDelPayQrcode;
  const payload = getDelPayQrcodePayload(req);

  let result;
  if (deps.delPayQrcode) {
    result = await delPayQrcode(payload);
  } else {
    const repository = createPayQrcodeRepository(req.app.locals.db);
    result = await delPayQrcode(payload, repository);
  }

  res.json(result);
}

module.exports = {
  getAddPayQrcodePayload,
  getPayQrcodeListPayload,
  getDelPayQrcodePayload,
  addPayQrcodeController,
  getPayQrcodesController,
  delPayQrcodeController
};

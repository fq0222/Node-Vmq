/**
 * 固定金额二维码服务模块
 * 负责固定金额二维码的新增、分页查询和删除逻辑
 */

const { createLogger } = require('../utils/logger');
const { success, error } = require('../utils/response');

const logger = createLogger('api:service:pay-qrcode');

/**
 * 新增固定金额二维码
 * @param {{payUrl?: string, price?: string|number, type?: string|number}} payload - 输入参数
 * @param {{createPayQrcode: Function}} repository - 仓储对象
 * @returns {Promise<{code: number, msg: string, data: null}>} 响应结果
 */
async function addPayQrcode(payload, repository) {
  logger.info('开始新增固定金额二维码');

  const payUrl = payload.payUrl == null ? '' : String(payload.payUrl).trim();
  const price = Number(payload.price || 0);
  const type = Number(payload.type || 0);

  // 保持原项目宽松校验逻辑：缺失 payUrl、price=0、type=0 都直接失败
  if (!payUrl || price === 0 || type === 0) {
    logger.warn(`固定金额二维码新增失败，payUrl=${payUrl || 'empty'}，price=${price}，type=${type}`);
    return error('失败');
  }

  await repository.createPayQrcode({
    payUrl,
    price,
    type
  });

  logger.info('固定金额二维码新增成功');
  return success();
}

/**
 * 分页查询固定金额二维码
 * @param {{page?: string|number, limit?: string|number, type?: string|number}} payload - 查询参数
 * @param {{findPayQrcodes: Function}} repository - 仓储对象
 * @returns {Promise<{code: number, msg: string, count: number, data: Array<Record<string, unknown>>}>} 分页结果
 */
async function getPayQrcodes(payload, repository) {
  logger.info('开始分页查询固定金额二维码');

  const page = Number(payload.page || 1);
  const limit = Number(payload.limit || 20);
  const typeValue = payload.type == null || payload.type === ''
    ? null
    : Number(payload.type);

  const result = await repository.findPayQrcodes({
    page,
    limit,
    type: typeValue
  });

  logger.info(`固定金额二维码分页查询成功，count=${result.count}`);
  return {
    code: 0,
    msg: '',
    count: result.count,
    data: result.rows
  };
}

/**
 * 删除固定金额二维码
 * @param {{id?: string|number}} payload - 删除参数
 * @param {{deletePayQrcodeById: Function}} repository - 仓储对象
 * @returns {Promise<{code: number, msg: string, data: null}>} 响应结果
 */
async function delPayQrcode(payload, repository) {
  logger.info('开始删除固定金额二维码');

  const id = Number(payload.id || 0);
  await repository.deletePayQrcodeById(id);

  logger.info(`固定金额二维码删除成功，id=${id}`);
  return success();
}

module.exports = {
  addPayQrcode,
  getPayQrcodes,
  delPayQrcode
};

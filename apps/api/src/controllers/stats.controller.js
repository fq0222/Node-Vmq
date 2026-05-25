/**
 * 后台统计控制器模块
 * 负责后台首页统计接口的请求编排，保持旧版 /admin/getMain 兼容行为
 */

const { createLogger } = require('../utils/logger');
const { createPayOrdersRepository } = require('../repositories/pay-orders.repository');
const { getMainStats: defaultGetMainStats } = require('../services/stats.service');

const logger = createLogger('api:controller:stats');

/**
 * 获取后台首页统计控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{getMainStats?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function getMainController(req, res, deps = {}) {
  logger.info('收到后台首页统计请求');

  const getMainStats = deps.getMainStats || defaultGetMainStats;

  let result;
  if (deps.getMainStats) {
    result = await getMainStats();
  } else {
    const payOrdersRepository = createPayOrdersRepository(req.app.locals.db);
    result = await getMainStats(payOrdersRepository);
  }

  res.json(result);
}

module.exports = {
  getMainController
};

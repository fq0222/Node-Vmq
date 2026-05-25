/**
 * 认证控制器模块
 * 负责登录和退出登录接口的请求编排，不直接承载具体校验规则
 */

const { createLogger } = require('../utils/logger');
const { success } = require('../utils/response');
const { createSettingsRepository } = require('../repositories/settings.repository');
const { authenticateAdmin: defaultAuthenticateAdmin } = require('../services/auth.service');

const logger = createLogger('api:controller:auth');

/**
 * 统一提取登录参数
 * 兼容 JSON、表单和 query 方式传参
 * @param {import('express').Request} req - 请求对象
 * @returns {{user?: string, pass?: string}} 登录参数
 */
function getLoginPayload(req) {
  return {
    user: req.body?.user || req.query?.user,
    pass: req.body?.pass || req.query?.pass
  };
}

/**
 * 管理员登录控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{authenticateAdmin?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function loginController(req, res, deps = {}) {
  logger.info('收到管理员登录请求');

  const authenticateAdmin = deps.authenticateAdmin || defaultAuthenticateAdmin;
  const payload = getLoginPayload(req);

  // 允许测试注入认证函数，避免单元测试依赖真实数据库连接
  let result;
  if (deps.authenticateAdmin) {
    result = await authenticateAdmin(payload);
  } else {
    const settingsRepository = createSettingsRepository(req.app.locals.db);
    result = await authenticateAdmin(payload, settingsRepository);
  }

  if (result.code === 1) {
    req.session.login = '1';
    logger.info(`管理员登录成功，user=${String(payload.user || '').trim()}`);
  } else {
    logger.warn(`管理员登录失败，user=${String(payload.user || '').trim() || 'empty'}`);
  }

  res.json(result);
}

/**
 * 管理员退出登录控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @returns {Promise<void>}
 */
async function logoutController(req, res) {
  logger.info('收到管理员退出登录请求');

  if (req.session) {
    delete req.session.login;
  }

  logger.info('管理员退出登录完成');
  res.json(success());
}

module.exports = {
  getLoginPayload,
  loginController,
  logoutController
};

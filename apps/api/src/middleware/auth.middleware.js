/**
 * 后台认证中间件
 * 统一拦截后台接口访问，要求请求已建立管理员会话
 */

const { createLogger } = require('../utils/logger');
const { error } = require('../utils/response');

const logger = createLogger('api:middleware:auth');

/**
 * 校验后台管理员会话
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {import('express').NextFunction} next - 下一步处理函数
 */
function requireAdminSession(req, res, next) {
  if (req.session && req.session.login === '1') {
    logger.info('后台会话校验通过');
    next();
    return;
  }

  logger.warn('后台会话校验失败，请求未登录');
  res.status(401).json(error('未登录'));
}

module.exports = {
  requireAdminSession
};

/**
 * 未命中路由处理中间件
 * 统一返回 404 响应，避免接口行为分散
 */

const { createLogger } = require('../utils/logger');

const logger = createLogger('api:not-found');

/**
 * 处理未命中的请求
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {import('express').NextFunction} next - 下一步函数
 */
function notFoundHandler(req, res, next) {
  // 打印警告日志，帮助开发阶段发现错误路由
  logger.warn(`未找到路由：${req.method} ${req.originalUrl}`);

  res.status(404).json({
    code: -1,
    msg: '接口不存在',
    data: null
  });
}

module.exports = {
  notFoundHandler
};

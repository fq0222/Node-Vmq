/**
 * 全局错误处理中间件
 * 统一格式化后端服务的异常输出
 */

const { createLogger } = require('../utils/logger');

const logger = createLogger('api:error');

/**
 * 处理应用异常
 * @param {Error} err - 错误对象
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {import('express').NextFunction} next - 下一步函数
 */
function errorHandler(err, req, res, next) {
  // 关键错误统一打印，便于后续排查
  logger.error(`请求处理失败：${req.method} ${req.originalUrl} - ${err.message}`);

  res.status(500).json({
    code: -1,
    msg: '服务器内部错误',
    data: null
  });
}

module.exports = {
  errorHandler
};

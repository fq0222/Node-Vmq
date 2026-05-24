/**
 * Express 应用工厂
 * 负责创建并配置后端应用实例
 */

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const routes = require('./routes');
const { notFoundHandler } = require('./middleware/not-found');
const { errorHandler } = require('./middleware/error-handler');
const { createLogger } = require('./utils/logger');

const logger = createLogger('api:app');

/**
 * 创建 Express 应用实例
 * @param {{
 *   sessionSecret: string,
 *   webOrigin: string
 * }} config - 运行配置
 * @returns {import('express').Express} Express 应用
 */
function createApp(config) {
  const app = express();

  // 记录应用初始化开始日志，方便后续启动排障
  logger.info('开始创建 Express 应用实例');

  // 配置跨域访问，方便前后端分离开发
  app.use(
    cors({
      origin: config.webOrigin,
      credentials: true
    })
  );

  // 解析 JSON 请求体
  app.use(express.json());

  // 解析表单请求体，兼容旧接口后续可能使用的 form 提交
  app.use(express.urlencoded({ extended: true }));

  // 初始化会话能力，为 TP-04 后台登录鉴权做准备
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax'
      }
    })
  );

  // 注册主路由
  app.use('/', routes);

  // 注册未命中路由处理
  app.use(notFoundHandler);

  // 注册全局错误处理
  app.use(errorHandler);

  logger.info('Express 应用实例创建完成');

  return app;
}

module.exports = {
  createApp
};

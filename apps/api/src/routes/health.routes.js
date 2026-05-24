/**
 * 健康检查路由
 * 用于工程基础设施阶段验证服务是否正常启动
 */

const express = require('express');
const { createLogger } = require('../utils/logger');

const router = express.Router();
const logger = createLogger('api:health');

/**
 * 健康检查接口
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 */
router.get('/health', (req, res) => {
  // 关键访问点打印日志，便于后续联调确认服务状态
  logger.info('收到健康检查请求');

  res.json({
    code: 1,
    msg: '成功',
    data: {
      service: 'node-vmq-api',
      status: 'ok',
      timestamp: Date.now()
    }
  });
});

module.exports = router;

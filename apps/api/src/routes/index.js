/**
 * 路由聚合模块
 * 统一注册当前阶段的所有后端接口
 */

const express = require('express');
const healthRoutes = require('./health.routes');

const router = express.Router();

/**
 * 根路由
 * 这里用于给开发阶段提供一个简洁的服务入口说明
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 */
router.get('/', (req, res) => {
  res.json({
    code: 1,
    msg: 'Node-Vmq API 已启动',
    data: {
      stage: 'TP-01',
      module: '工程基础设施'
    }
  });
});

// 注册健康检查路由
router.use('/', healthRoutes);

module.exports = router;

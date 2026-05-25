/**
 * 路由聚合模块
 * 统一注册当前阶段所有可访问的后端接口
 */

const express = require('express');
const { CURRENT_STAGE } = require('../../../../packages/shared/src');
const { success } = require('../utils/response');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const qrcodeRoutes = require('./qrcode.routes');
const orderRoutes = require('./order.routes');
const monitorRoutes = require('./monitor.routes');

const router = express.Router();

/**
 * 根路由
 * 为开发阶段提供简洁的服务状态说明
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 */
router.get('/', (req, res) => {
  res.json(success({
    stage: CURRENT_STAGE,
    module: '监控端兼容模块'
  }, 'Node-Vmq API 已启动'));
});

// 注册基础健康检查接口
router.use('/', healthRoutes);

// 注册认证接口
router.use('/', authRoutes);

// 注册后台接口
router.use('/', adminRoutes);

// 注册二维码工具接口
router.use('/', qrcodeRoutes);

// 注册订单核心接口
router.use('/', orderRoutes);

// 注册监控端兼容接口
router.use('/', monitorRoutes);

module.exports = router;

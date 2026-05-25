/**
 * 后台管理路由模块
 * 提供 TP-04 阶段的最小后台会话校验接口
 */

const express = require('express');
const { requireAdminSession } = require('../middleware/auth.middleware');
const { success } = require('../utils/response');

const router = express.Router();

router.use('/admin', requireAdminSession);

/**
 * 返回当前后台会话状态
 * 用于 TP-04 阶段快速验证登录态是否建立成功
 */
router.get('/admin/session', (req, res) => {
  res.json(success({
    login: req.session.login
  }));
});

module.exports = router;

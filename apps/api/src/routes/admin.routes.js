/**
 * 后台管理路由模块
 * 提供后台会话、系统设置与菜单兼容接口
 */

const express = require('express');
const { requireAdminSession } = require('../middleware/auth.middleware');
const { success } = require('../utils/response');
const {
  getSettingsController,
  saveSettingController,
  getMenuController
} = require('../controllers/settings.controller');

const router = express.Router();

// 菜单接口保持旧版兼容，未登录时返回 null
router.get('/admin/getMenu', getMenuController);
router.post('/admin/getMenu', getMenuController);

// 其余后台接口继续使用统一会话校验
router.get('/admin/session', requireAdminSession, (req, res) => {
  res.json(success({
    login: req.session.login
  }));
});

router.get('/admin/getSettings', requireAdminSession, getSettingsController);
router.post('/admin/getSettings', requireAdminSession, getSettingsController);
router.get('/admin/saveSetting', requireAdminSession, saveSettingController);
router.post('/admin/saveSetting', requireAdminSession, saveSettingController);

module.exports = router;

/**
 * 后台管理路由模块
 * 提供后台会话、系统设置、二维码、订单与补单兼容接口
 */

const express = require('express');
const { requireAdminSession } = require('../middleware/auth.middleware');
const { success } = require('../utils/response');
const {
  getSettingsController,
  saveSettingController,
  getMenuController
} = require('../controllers/settings.controller');
const {
  addPayQrcodeController,
  getPayQrcodesController,
  delPayQrcodeController
} = require('../controllers/pay-qrcode.controller');
const {
  getOrdersController,
  setBdController,
  delOrderController,
  delGqOrderController,
  delLastOrderController
} = require('../controllers/callback-admin.controller');
const { getMainController } = require('../controllers/stats.controller');

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
router.get('/admin/getPayQrcodes', requireAdminSession, getPayQrcodesController);
router.post('/admin/getPayQrcodes', requireAdminSession, getPayQrcodesController);
router.get('/admin/addPayQrcode', requireAdminSession, addPayQrcodeController);
router.post('/admin/addPayQrcode', requireAdminSession, addPayQrcodeController);
router.get('/admin/delPayQrcode', requireAdminSession, delPayQrcodeController);
router.post('/admin/delPayQrcode', requireAdminSession, delPayQrcodeController);
router.get('/admin/getOrders', requireAdminSession, getOrdersController);
router.post('/admin/getOrders', requireAdminSession, getOrdersController);
router.get('/admin/setBd', requireAdminSession, setBdController);
router.post('/admin/setBd', requireAdminSession, setBdController);
router.get('/admin/delOrder', requireAdminSession, delOrderController);
router.post('/admin/delOrder', requireAdminSession, delOrderController);
router.get('/admin/delGqOrder', requireAdminSession, delGqOrderController);
router.post('/admin/delGqOrder', requireAdminSession, delGqOrderController);
router.get('/admin/delLastOrder', requireAdminSession, delLastOrderController);
router.post('/admin/delLastOrder', requireAdminSession, delLastOrderController);
router.get('/admin/getMain', requireAdminSession, getMainController);
router.post('/admin/getMain', requireAdminSession, getMainController);

module.exports = router;

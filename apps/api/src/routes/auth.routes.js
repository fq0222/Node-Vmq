/**
 * 认证路由模块
 * 负责暴露后台登录与退出登录接口
 */

const express = require('express');
const { loginController, logoutController } = require('../controllers/auth.controller');

const router = express.Router();

router.get('/login', loginController);
router.post('/login', loginController);
router.get('/logout', logoutController);
router.post('/logout', logoutController);

module.exports = router;

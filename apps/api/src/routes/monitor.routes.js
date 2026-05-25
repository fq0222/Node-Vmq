/**
 * 监控端兼容路由模块
 * 负责注册心跳、支付推送与状态查询接口
 */

const express = require('express');
const {
  appHeartController,
  appPushController,
  getStateController
} = require('../controllers/monitor.controller');

const router = express.Router();

router.get('/appHeart', appHeartController);
router.post('/appHeart', appHeartController);
router.get('/appPush', appPushController);
router.post('/appPush', appPushController);
router.get('/getState', getStateController);
router.post('/getState', getStateController);

module.exports = router;

/**
 * 订单核心路由模块
 * 负责注册创建订单、查询订单、检查状态和关闭订单接口
 */

const express = require('express');
const {
  createOrderController,
  getOrderController,
  checkOrderController,
  closeOrderController
} = require('../controllers/order.controller');

const router = express.Router();

router.get('/createOrder', createOrderController);
router.post('/createOrder', createOrderController);
router.get('/getOrder', getOrderController);
router.post('/getOrder', getOrderController);
router.get('/checkOrder', checkOrderController);
router.post('/checkOrder', checkOrderController);
router.get('/closeOrder', closeOrderController);
router.post('/closeOrder', closeOrderController);

module.exports = router;

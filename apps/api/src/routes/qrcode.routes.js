/**
 * 二维码工具路由模块
 * 负责注册二维码生成与解析接口
 */

const express = require('express');
const multer = require('multer');
const {
  enQrcodeController,
  deQrcodeController,
  deQrcode2Controller
} = require('../controllers/qrcode.controller');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage()
});

router.get('/enQrcode', enQrcodeController);
router.get('/deQrcode', deQrcodeController);
router.post('/deQrcode', deQrcodeController);
router.post('/deQrcode2', upload.single('file'), deQrcode2Controller);

module.exports = router;

/**
 * 系统配置键常量
 * 统一管理 settings 表中的核心配置项名称
 */

/**
 * 系统配置键名
 * 这里仅先放入 TP-03 和后续核心模块必用的字段
 */
const SETTING_KEYS = {
  USER: 'user',
  PASS: 'pass',
  NOTIFY_URL: 'notifyUrl',
  RETURN_URL: 'returnUrl',
  KEY: 'key',
  LAST_HEART: 'lastheart',
  LAST_PAY: 'lastpay',
  MONITOR_STATUS: 'jkstate',
  CLOSE_MINUTES: 'close',
  PAY_DISTINGUISH_MODE: 'payQf',
  WECHAT_QRCODE: 'wxpay',
  ALIPAY_QRCODE: 'zfbpay'
};

module.exports = {
  SETTING_KEYS
};

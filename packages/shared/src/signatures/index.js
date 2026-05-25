/**
 * 签名规则模块
 * 集中实现与旧系统兼容的 md5 签名算法
 */

const crypto = require('crypto');

/**
 * 计算 md5 值
 * @param {string} text - 待签名文本
 * @returns {string} md5 十六进制字符串
 */
function md5(text) {
  return crypto.createHash('md5').update(String(text)).digest('hex');
}

/**
 * 创建订单签名
 * 规则：md5(payId + param + type + price + key)
 * @param {{
 *   payId: string,
 *   param?: string,
 *   type: number,
 *   price: string,
 *   key: string
 * }} payload - 签名参数
 * @returns {string} 签名结果
 */
function signCreateOrder(payload) {
  return md5(`${payload.payId}${payload.param || ''}${payload.type}${payload.price}${payload.key}`);
}

/**
 * 关闭订单签名
 * 规则：md5(orderId + key)
 * @param {{
 *   orderId: string,
 *   key: string
 * }} payload - 签名参数
 * @returns {string} 签名结果
 */
function signCloseOrder(payload) {
  return md5(`${payload.orderId}${payload.key}`);
}

/**
 * 监控端心跳签名
 * 规则：md5(t + key)
 * @param {{
 *   timestamp: string | number,
 *   key: string
 * }} payload - 签名参数
 * @returns {string} 签名结果
 */
function signAppHeart(payload) {
  return md5(`${payload.timestamp}${payload.key}`);
}

/**
 * 监控端推送签名
 * 规则：md5(type + price + t + key)
 * @param {{
 *   type: number,
 *   price: string,
 *   timestamp: string | number,
 *   key: string
 * }} payload - 签名参数
 * @returns {string} 签名结果
 */
function signAppPush(payload) {
  return md5(`${payload.type}${payload.price}${payload.timestamp}${payload.key}`);
}

/**
 * 异步通知签名
 * 规则：md5(payId + param + type + price + reallyPrice + key)
 * @param {{
 *   payId: string,
 *   param?: string,
 *   type: number,
 *   price: string,
 *   reallyPrice: string,
 *   key: string
 * }} payload - 签名参数
 * @returns {string} 签名结果
 */
function signNotifyCallback(payload) {
  return md5(
    `${payload.payId}${payload.param || ''}${payload.type}${payload.price}${payload.reallyPrice}${payload.key}`
  );
}

module.exports = {
  md5,
  signCreateOrder,
  signCloseOrder,
  signAppHeart,
  signAppPush,
  signNotifyCallback
};

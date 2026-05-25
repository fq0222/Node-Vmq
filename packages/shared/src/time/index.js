/**
 * 时间规则模块
 * 统一处理客户端时间偏差校验逻辑
 */

/**
 * 判断客户端时间偏差是否在允许范围内
 * 默认阈值与旧系统一致，为 50 秒
 * @param {number | string} clientTimestamp - 客户端时间戳
 * @param {number | string} serverTimestamp - 服务端时间戳
 * @param {number} [allowedMilliseconds=50000] - 允许偏差毫秒数
 * @returns {boolean} 是否在允许范围内
 */
function isClientTimeSkewValid(clientTimestamp, serverTimestamp, allowedMilliseconds = 50000) {
  return Math.abs(Number(clientTimestamp) - Number(serverTimestamp)) <= allowedMilliseconds;
}

module.exports = {
  isClientTimeSkewValid
};

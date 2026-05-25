/**
 * 统一响应工具
 * 集中管理接口返回结构，保证新旧接口输出格式一致
 */

/**
 * 创建成功响应体
 * @param {unknown} data - 返回数据
 * @param {string} msg - 返回消息
 * @returns {{code: number, msg: string, data: unknown}} 成功响应
 */
function success(data = null, msg = '成功') {
  return {
    code: 1,
    msg,
    data
  };
}

/**
 * 创建失败响应体
 * @param {string} msg - 返回消息
 * @param {unknown} data - 返回数据
 * @param {number} code - 业务状态码
 * @returns {{code: number, msg: string, data: unknown}} 失败响应
 */
function error(msg, data = null, code = -1) {
  return {
    code,
    msg,
    data
  };
}

module.exports = {
  success,
  error
};

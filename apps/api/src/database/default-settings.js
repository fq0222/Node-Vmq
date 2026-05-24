/**
 * 默认系统配置模块
 * 统一维护首次启动时需要写入 settings 表的默认数据
 */

const crypto = require('crypto');

/**
 * 生成默认通讯密钥
 * 这里沿用原项目的思路，基于当前时间生成 md5 字符串
 * @returns {string} 默认通讯密钥
 */
function createDefaultCommunicationKey() {
  return crypto.createHash('md5').update(String(Date.now())).digest('hex');
}

/**
 * 创建默认配置列表
 * 注意：该函数每次调用都会生成新的 key，因此只应用在首次初始化流程中
 * @returns {Array<{key: string, value: string}>} 默认配置数组
 */
function createDefaultSettings() {
  return [
    { key: 'user', value: 'admin' },
    { key: 'pass', value: 'admin' },
    { key: 'notifyUrl', value: '' },
    { key: 'returnUrl', value: '' },
    { key: 'key', value: createDefaultCommunicationKey() },
    { key: 'lastheart', value: '0' },
    { key: 'lastpay', value: '0' },
    { key: 'jkstate', value: '-1' },
    { key: 'close', value: '5' },
    { key: 'payQf', value: '1' },
    { key: 'wxpay', value: '' },
    { key: 'zfbpay', value: '' }
  ];
}

module.exports = {
  createDefaultSettings
};

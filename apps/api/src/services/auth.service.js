/**
 * 认证服务模块
 * 负责管理员账号密码校验，保持与旧版后台登录行为兼容
 */

const { SETTING_KEYS } = require('../../../../packages/shared/src');
const { createLogger } = require('../utils/logger');
const { success, error } = require('../utils/response');

const logger = createLogger('api:service:auth');

/**
 * 校验管理员登录信息
 * @param {{user?: string, pass?: string}} payload - 登录输入
 * @param {{getSettingValue: (key: string) => Promise<string|null>}} settingsRepository - 配置仓储
 * @returns {Promise<{code: number, msg: string, data: null}>} 校验结果
 */
async function authenticateAdmin(payload, settingsRepository) {
  logger.info('开始校验管理员登录信息');

  const inputUser = String(payload.user || '').trim();
  const inputPass = String(payload.pass || '').trim();
  const savedUser = await settingsRepository.getSettingValue(SETTING_KEYS.USER);
  const savedPass = await settingsRepository.getSettingValue(SETTING_KEYS.PASS);

  if (inputUser === savedUser && inputPass === savedPass) {
    logger.info(`管理员登录校验通过，user=${inputUser}`);
    return success();
  }

  logger.warn(`管理员登录校验失败，user=${inputUser || 'empty'}`);
  return error('账号或密码不正确');
}

module.exports = {
  authenticateAdmin
};

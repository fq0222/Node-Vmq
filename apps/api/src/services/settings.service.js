/**
 * 系统设置服务模块
 * 负责后台系统配置的白名单保存、全量读取与旧菜单兼容构建
 */

const { SETTING_KEYS } = require('../../../../packages/shared/src');
const { createLogger } = require('../utils/logger');
const { success } = require('../utils/response');

const logger = createLogger('api:service:settings');

const EDITABLE_SETTING_KEYS = [
  SETTING_KEYS.USER,
  SETTING_KEYS.PASS,
  SETTING_KEYS.NOTIFY_URL,
  SETTING_KEYS.RETURN_URL,
  SETTING_KEYS.KEY,
  SETTING_KEYS.WECHAT_QRCODE,
  SETTING_KEYS.ALIPAY_QRCODE,
  SETTING_KEYS.CLOSE_MINUTES,
  SETTING_KEYS.PAY_DISTINGUISH_MODE
];

/**
 * 读取全部系统配置
 * @param {{getAllSettings: () => Promise<Array<{key: string, value: string}>>}} settingsRepository - 配置仓储
 * @returns {Promise<{code: number, msg: string, data: Record<string, string>}>} 响应结果
 */
async function getSettings(settingsRepository) {
  logger.info('开始读取系统设置');

  const rows = await settingsRepository.getAllSettings();
  const settingsMap = {};

  for (const row of rows) {
    settingsMap[row.key] = row.value;
  }

  logger.info(`系统设置读取完成，数量=${rows.length}`);
  return success(settingsMap);
}

/**
 * 保存可编辑系统配置
 * @param {Record<string, string | undefined>} payload - 配置输入
 * @param {{saveSettingValue: (key: string, value: string) => Promise<void>}} settingsRepository - 配置仓储
 * @returns {Promise<{code: number, msg: string, data: null}>} 响应结果
 */
async function saveEditableSettings(payload, settingsRepository) {
  logger.info('开始保存系统设置');

  for (const key of EDITABLE_SETTING_KEYS) {
    // 保持原项目宽松行为，缺失字段也按空字符串落库
    const value = payload[key] == null ? '' : String(payload[key]);
    await settingsRepository.saveSettingValue(key, value);
  }

  logger.info(`系统设置保存完成，字段数量=${EDITABLE_SETTING_KEYS.length}`);
  return success();
}

/**
 * 构建旧版后台菜单
 * @param {number} timestamp - 当前时间戳
 * @returns {Array<Record<string, unknown>>} 菜单数组
 */
function buildAdminMenu(timestamp) {
  const suffix = `?t=${timestamp}`;

  logger.info(`开始构建后台菜单，timestamp=${timestamp}`);

  return [
    {
      name: '系统设置',
      type: 'url',
      url: `admin/setting.html${suffix}`
    },
    {
      name: '监控端设置',
      type: 'url',
      url: `admin/jk.html${suffix}`
    },
    {
      name: '微信二维码',
      type: 'menu',
      node: [
        {
          name: '添加',
          type: 'url',
          url: `admin/addwxqrcode.html${suffix}`
        },
        {
          name: '管理',
          type: 'url',
          url: `admin/wxqrcodelist.html${suffix}`
        }
      ]
    },
    {
      name: '支付宝二维码',
      type: 'menu',
      node: [
        {
          name: '添加',
          type: 'url',
          url: `admin/addzfbqrcode.html${suffix}`
        },
        {
          name: '管理',
          type: 'url',
          url: `admin/zfbqrcodelist.html${suffix}`
        }
      ]
    },
    {
      name: '订单列表',
      type: 'url',
      url: `admin/orderlist.html${suffix}`
    },
    {
      name: 'Api说明',
      type: 'url',
      url: `../api.html${suffix}`
    }
  ];
}

module.exports = {
  EDITABLE_SETTING_KEYS,
  getSettings,
  saveEditableSettings,
  buildAdminMenu
};

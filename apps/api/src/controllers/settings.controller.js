/**
 * 系统设置控制器模块
 * 负责后台设置与菜单接口的请求编排，保持旧接口兼容行为
 */

const { createLogger } = require('../utils/logger');
const { createSettingsRepository } = require('../repositories/settings.repository');
const {
  getSettings: defaultGetSettings,
  saveEditableSettings: defaultSaveEditableSettings,
  buildAdminMenu: defaultBuildAdminMenu
} = require('../services/settings.service');

const logger = createLogger('api:controller:settings');

/**
 * 统一提取可编辑设置参数
 * 兼容 body 与 query 两种来源
 * @param {import('express').Request} req - 请求对象
 * @returns {Record<string, string | undefined>} 设置参数
 */
function getSettingPayload(req) {
  return {
    user: req.body?.user || req.query?.user,
    pass: req.body?.pass || req.query?.pass,
    notifyUrl: req.body?.notifyUrl || req.query?.notifyUrl,
    returnUrl: req.body?.returnUrl || req.query?.returnUrl,
    key: req.body?.key || req.query?.key,
    wxpay: req.body?.wxpay || req.query?.wxpay,
    zfbpay: req.body?.zfbpay || req.query?.zfbpay,
    close: req.body?.close || req.query?.close,
    payQf: req.body?.payQf || req.query?.payQf
  };
}

/**
 * 获取系统设置控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{getSettings?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function getSettingsController(req, res, deps = {}) {
  logger.info('收到获取系统设置请求');

  const getSettings = deps.getSettings || defaultGetSettings;

  let result;
  if (deps.getSettings) {
    result = await getSettings();
  } else {
    const settingsRepository = createSettingsRepository(req.app.locals.db);
    result = await getSettings(settingsRepository);
  }

  res.json(result);
}

/**
 * 保存系统设置控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{saveEditableSettings?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function saveSettingController(req, res, deps = {}) {
  logger.info('收到保存系统设置请求');

  const saveEditableSettings = deps.saveEditableSettings || defaultSaveEditableSettings;
  const payload = getSettingPayload(req);

  let result;
  if (deps.saveEditableSettings) {
    result = await saveEditableSettings(payload);
  } else {
    const settingsRepository = createSettingsRepository(req.app.locals.db);
    result = await saveEditableSettings(payload, settingsRepository);
  }

  res.json(result);
}

/**
 * 获取后台菜单控制器
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {{buildAdminMenu?: Function}} deps - 可注入依赖
 * @returns {Promise<void>}
 */
async function getMenuController(req, res, deps = {}) {
  logger.info('收到获取后台菜单请求');

  // 保持原项目兼容行为，未登录时直接返回 null
  if (!req.session || req.session.login !== '1') {
    logger.warn('后台菜单请求未登录，返回 null');
    res.json(null);
    return;
  }

  const buildAdminMenu = deps.buildAdminMenu || defaultBuildAdminMenu;
  const menu = buildAdminMenu(Date.now());
  res.json(menu);
}

module.exports = {
  getSettingPayload,
  getSettingsController,
  saveSettingController,
  getMenuController
};

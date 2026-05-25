/**
 * 定时任务服务模块
 * 负责定时清理超时订单并判定监控端离线状态
 */

const { SETTING_KEYS, buildPriceKey } = require('../../../../packages/shared/src');
const { createLogger } = require('../utils/logger');

const logger = createLogger('api:job:scheduler');

/**
 * 执行一次定时任务轮询
 * @param {{
 *   settingsRepository: {getSettingValue: Function, saveSettingValue: Function},
 *   payOrdersRepository: {markTimeoutOrders: Function, findOrdersByCloseDate: Function},
 *   tmpPricesRepository: {releasePriceKey: Function},
 *   now?: () => number
 * }} deps - 依赖集合
 * @returns {Promise<void>}
 */
async function runSchedulerTick(deps) {
  const now = deps.now ? deps.now() : Date.now();
  logger.info('开始执行定时任务轮询');

  try {
    // 第一步：批量关闭已超时但仍处于待支付状态的订单
    const timeoutMinutes = Number(await deps.settingsRepository.getSettingValue(SETTING_KEYS.CLOSE_MINUTES) || 5);
    const closeDate = now;
    const timeoutBefore = now - (timeoutMinutes * 60 * 1000);

    const affectedRows = await deps.payOrdersRepository.markTimeoutOrders({
      timeoutBefore,
      closeDate
    });

    if (affectedRows > 0) {
      const closedOrders = await deps.payOrdersRepository.findOrdersByCloseDate(closeDate);
      for (const order of closedOrders) {
        await deps.tmpPricesRepository.releasePriceKey(
          buildPriceKey(Number(order.type), order.reallyPrice)
        );
      }
      logger.info(`超时订单清理完成，count=${affectedRows}`);
    } else {
      logger.info('本轮未发现需要关闭的超时订单');
    }
  } catch (error) {
    logger.error(`超时订单清理任务执行异常：${error.message}`);
  }

  try {
    // 第二步：若监控端已超过 60 秒未上报心跳，则自动标记离线
    const lastheart = await deps.settingsRepository.getSettingValue(SETTING_KEYS.LAST_HEART) || '0';
    const state = await deps.settingsRepository.getSettingValue(SETTING_KEYS.MONITOR_STATUS) || '-1';

    if (state === '1' && (now - Number(lastheart)) > 60 * 1000) {
      await deps.settingsRepository.saveSettingValue(SETTING_KEYS.MONITOR_STATUS, '0');
      logger.info(`监控端离线状态已自动更新，lastheart=${lastheart}`);
    } else {
      logger.info(`监控端离线检测完成，state=${state}，lastheart=${lastheart}`);
    }
  } catch (error) {
    logger.error(`监控端离线检测任务执行异常：${error.message}`);
  }
}

/**
 * 启动定时任务调度器
 * @param {object} deps - 依赖集合
 * @param {{
 *   setIntervalImpl?: (handler: Function, interval: number) => unknown
 * }} [options={}] - 可选注入项
 * @returns {unknown} 定时器句柄
 */
function startScheduler(deps, options = {}) {
  const setIntervalImpl = options.setIntervalImpl || setInterval;
  logger.info('开始注册定时任务调度器，间隔=30000ms');

  return setIntervalImpl(() => {
    runSchedulerTick(deps).catch((error) => {
      logger.error(`定时任务轮询发生未捕获异常：${error.message}`);
    });
  }, 30000);
}

module.exports = {
  runSchedulerTick,
  startScheduler
};

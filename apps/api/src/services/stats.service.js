/**
 * 后台统计服务模块
 * 复刻原项目 /admin/getMain 统计口径，统一汇总今日订单、成功订单、关闭订单与累计金额
 */

const { ORDER_STATES } = require('../../../../packages/shared/src');
const { createLogger } = require('../utils/logger');
const { success } = require('../utils/response');

const logger = createLogger('api:service:stats');

/**
 * 将金额格式化为原项目兼容形式
 * 保留最多两位小数，不强制补零
 * @param {number} amount - 待格式化金额
 * @returns {string} 格式化后的金额字符串
 */
function formatStatsMoney(amount) {
  const formatter = Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true
  });
  return formatter.format(Number(amount || 0));
}

/**
 * 获取上海时区当天的起止时间戳
 * @param {() => Date} [nowProvider] - 当前时间提供函数
 * @returns {{startTime: number, endTime: number}} 当日起止毫秒时间戳
 */
function getShanghaiTodayRange(nowProvider = () => new Date()) {
  const now = nowProvider();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((item) => item.type === 'year')?.value;
  const month = parts.find((item) => item.type === 'month')?.value;
  const day = parts.find((item) => item.type === 'day')?.value;

  const startTime = new Date(`${year}-${month}-${day}T00:00:00+08:00`).getTime();
  const endTime = new Date(`${year}-${month}-${day}T23:59:59+08:00`).getTime();

  return {
    startTime,
    endTime
  };
}

/**
 * 读取后台首页统计数据
 * 统计口径严格复刻原项目：
 * 1. todaySuccessOrder = 今日 state=1 + state=2
 * 2. todayMoney = 今日 state=1 + state=2 的 price 汇总
 * 3. countOrder = 全量 state=1 数量
 * 4. countMoney = 全量 state=1 + state=2 的 price 汇总
 * @param {{
 *   countOrdersByCreateDateRange: Function,
 *   countOrdersByCreateDateRangeAndState: Function,
 *   sumPricesByCreateDateRangeAndState: Function,
 *   countOrdersByState: Function,
 *   sumPricesByState: Function
 * }} repository - 订单统计仓储
 * @param {{now?: () => Date}} [deps={}] - 依赖注入
 * @returns {Promise<{code: number, msg: string, data: Record<string, string>}>} 统计结果
 */
async function getMainStats(repository, deps = {}) {
  logger.info('开始读取后台首页统计数据');

  const range = getShanghaiTodayRange(deps.now);
  const todayOrder = await repository.countOrdersByCreateDateRange(range.startTime, range.endTime);
  const todaySuccessOrderPaid = await repository.countOrdersByCreateDateRangeAndState(
    range.startTime,
    range.endTime,
    ORDER_STATES.PAID
  );
  const todaySuccessOrderNotifyFailed = await repository.countOrdersByCreateDateRangeAndState(
    range.startTime,
    range.endTime,
    ORDER_STATES.NOTIFY_FAILED
  );
  const todayCloseOrder = await repository.countOrdersByCreateDateRangeAndState(
    range.startTime,
    range.endTime,
    ORDER_STATES.EXPIRED
  );
  const todayPaidMoney = Number(
    await repository.sumPricesByCreateDateRangeAndState(range.startTime, range.endTime, ORDER_STATES.PAID)
  ) || 0;
  const todayNotifyFailedMoney = Number(
    await repository.sumPricesByCreateDateRangeAndState(range.startTime, range.endTime, ORDER_STATES.NOTIFY_FAILED)
  ) || 0;
  const countOrder = await repository.countOrdersByState(ORDER_STATES.PAID);
  const countPaidMoney = Number(await repository.sumPricesByState(ORDER_STATES.PAID)) || 0;
  const countNotifyFailedMoney = Number(await repository.sumPricesByState(ORDER_STATES.NOTIFY_FAILED)) || 0;

  const data = {
    todayOrder: String(todayOrder),
    todaySuccessOrder: String(todaySuccessOrderPaid + todaySuccessOrderNotifyFailed),
    todayCloseOrder: String(todayCloseOrder),
    todayMoney: formatStatsMoney(todayPaidMoney + todayNotifyFailedMoney),
    countOrder: String(countOrder),
    countMoney: formatStatsMoney(countPaidMoney + countNotifyFailedMoney)
  };

  logger.info(`后台首页统计数据读取完成，todayOrder=${data.todayOrder}，countOrder=${data.countOrder}`);
  return success(data);
}

module.exports = {
  formatStatsMoney,
  getShanghaiTodayRange,
  getMainStats
};

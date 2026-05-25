/**
 * TP-12 后台统计服务测试
 * 先锁定原项目统计口径，再补最小实现，避免今日统计与累计统计出现兼容偏差
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { getMainStats, getShanghaiTodayRange, formatStatsMoney } = require('../src/services/stats.service');

test('金额格式化应保持原项目兼容的最多两位小数表现', () => {
  assert.equal(formatStatsMoney(0), '0');
  assert.equal(formatStatsMoney(12), '12');
  assert.equal(formatStatsMoney(12.3), '12.3');
  assert.equal(formatStatsMoney(12.345), '12.35');
});

test('应按上海时区计算当日开始与结束时间', () => {
  const range = getShanghaiTodayRange(() => new Date('2026-05-25T01:23:45.000Z'));

  assert.deepEqual(range, {
    startTime: 1779638400000,
    endTime: 1779724799000
  });
});

test('后台首页统计应严格复刻原项目统计口径', async () => {
  const calls = [];
  const repository = {
    countOrdersByCreateDateRange: async (startTime, endTime) => {
      calls.push(['countOrdersByCreateDateRange', startTime, endTime]);
      return 12;
    },
    countOrdersByCreateDateRangeAndState: async (startTime, endTime, state) => {
      calls.push(['countOrdersByCreateDateRangeAndState', startTime, endTime, state]);

      if (state === 1) {
        return 5;
      }
      if (state === 2) {
        return 2;
      }
      if (state === -1) {
        return 3;
      }
      return 0;
    },
    sumPricesByCreateDateRangeAndState: async (startTime, endTime, state) => {
      calls.push(['sumPricesByCreateDateRangeAndState', startTime, endTime, state]);

      if (state === 1) {
        return 100.12;
      }
      if (state === 2) {
        return 8.335;
      }
      return null;
    },
    countOrdersByState: async (state) => {
      calls.push(['countOrdersByState', state]);
      return state === 1 ? 88 : 0;
    },
    sumPricesByState: async (state) => {
      calls.push(['sumPricesByState', state]);

      if (state === 1) {
        return 888.5;
      }
      if (state === 2) {
        return 10.005;
      }
      return null;
    }
  };

  const result = await getMainStats(repository, {
    now: () => new Date('2026-05-25T01:23:45.000Z')
  });

  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: {
      todayOrder: '12',
      todaySuccessOrder: '7',
      todayCloseOrder: '3',
      todayMoney: '108.46',
      countOrder: '88',
      countMoney: '898.51'
    }
  });

  assert.equal(calls[0][0], 'countOrdersByCreateDateRange');
  assert.equal(calls[calls.length - 1][0], 'sumPricesByState');
});

test('金额汇总为空时应按 0 处理', async () => {
  const result = await getMainStats({
    countOrdersByCreateDateRange: async () => 0,
    countOrdersByCreateDateRangeAndState: async () => 0,
    sumPricesByCreateDateRangeAndState: async () => null,
    countOrdersByState: async () => 0,
    sumPricesByState: async () => null
  }, {
    now: () => new Date('2026-05-25T01:23:45.000Z')
  });

  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: {
      todayOrder: '0',
      todaySuccessOrder: '0',
      todayCloseOrder: '0',
      todayMoney: '0',
      countOrder: '0',
      countMoney: '0'
    }
  });
});

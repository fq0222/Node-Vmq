/**
 * TP-11 定时任务服务测试
 * 先定义超时关单、金额释放与监控离线判定行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  runSchedulerTick,
  startScheduler
} = require('../src/jobs/scheduler.service');

function createSettingsRepository(overrides = {}) {
  const settings = {
    close: '5',
    lastheart: '0',
    jkstate: '-1',
    ...overrides
  };

  return {
    getSettingValue: async (key) => settings[key] ?? null,
    saveSettingValue: async (key, value) => {
      settings[key] = value;
    }
  };
}

test('定时任务执行时应批量关闭超时待支付订单并释放金额占位', async () => {
  let timeoutPayload = null;
  const releasedPriceKeys = [];

  await runSchedulerTick({
    settingsRepository: createSettingsRepository({
      close: '5',
      lastheart: '0',
      jkstate: '-1'
    }),
    payOrdersRepository: {
      markTimeoutOrders: async (payload) => {
        timeoutPayload = payload;
        return 2;
      },
      findOrdersByCloseDate: async (closeDate) => {
        assert.equal(closeDate, 1779431415000);
        return [
          { type: 1, reallyPrice: 10.01 },
          { type: 2, reallyPrice: 20 }
        ];
      }
    },
    tmpPricesRepository: {
      releasePriceKey: async (priceKey) => {
        releasedPriceKeys.push(priceKey);
      }
    },
    now: () => 1779431415000
  });

  assert.deepEqual(timeoutPayload, {
    timeoutBefore: 1779431115000,
    closeDate: 1779431415000
  });
  assert.deepEqual(releasedPriceKeys, ['1-10.01', '2-20.00']);
});

test('定时任务执行时若没有超时订单则不应释放金额占位', async () => {
  let releasedCalled = false;

  await runSchedulerTick({
    settingsRepository: createSettingsRepository({
      close: '5',
      lastheart: '0',
      jkstate: '-1'
    }),
    payOrdersRepository: {
      markTimeoutOrders: async () => 0,
      findOrdersByCloseDate: async () => []
    },
    tmpPricesRepository: {
      releasePriceKey: async () => {
        releasedCalled = true;
      }
    },
    now: () => 1779431415000
  });

  assert.equal(releasedCalled, false);
});

test('定时任务执行时监控端超过 60 秒无心跳应自动标记离线', async () => {
  const settingsRepository = createSettingsRepository({
    close: '5',
    lastheart: '1779431354000',
    jkstate: '1'
  });

  await runSchedulerTick({
    settingsRepository,
    payOrdersRepository: {
      markTimeoutOrders: async () => 0,
      findOrdersByCloseDate: async () => []
    },
    tmpPricesRepository: {
      releasePriceKey: async () => {}
    },
    now: () => 1779431415000
  });

  assert.equal(await settingsRepository.getSettingValue('jkstate'), '0');
});

test('定时任务执行时监控端未在线则不应重复写离线状态', async () => {
  let saveCalled = false;

  await runSchedulerTick({
    settingsRepository: {
      getSettingValue: async (key) => {
        const values = {
          close: '5',
          lastheart: '1779431000000',
          jkstate: '0'
        };
        return values[key] ?? null;
      },
      saveSettingValue: async () => {
        saveCalled = true;
      }
    },
    payOrdersRepository: {
      markTimeoutOrders: async () => 0,
      findOrdersByCloseDate: async () => []
    },
    tmpPricesRepository: {
      releasePriceKey: async () => {}
    },
    now: () => 1779431415000
  });

  assert.equal(saveCalled, false);
});

test('启动调度器时应按 30 秒间隔注册定时任务', async () => {
  let receivedInterval = null;
  let scheduledHandler = null;

  const timer = startScheduler({
    settingsRepository: createSettingsRepository(),
    payOrdersRepository: {
      markTimeoutOrders: async () => 0,
      findOrdersByCloseDate: async () => []
    },
    tmpPricesRepository: {
      releasePriceKey: async () => {}
    }
  }, {
    setIntervalImpl: (handler, interval) => {
      scheduledHandler = handler;
      receivedInterval = interval;
      return { id: 'timer-1' };
    }
  });

  assert.equal(receivedInterval, 30000);
  assert.equal(typeof scheduledHandler, 'function');
  assert.deepEqual(timer, { id: 'timer-1' });
});

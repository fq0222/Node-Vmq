/**
 * TP-12 后台统计控制器测试
 * 先约束控制器的依赖注入与 JSON 返回行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { getMainController } = require('../src/controllers/stats.controller');

test('后台统计控制器应返回服务层结果', async () => {
  let jsonPayload = null;
  let called = false;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await getMainController({
    body: {},
    query: {}
  }, res, {
    getMainStats: async () => {
      called = true;
      return {
        code: 1,
        msg: '成功',
        data: {
          todayOrder: '1'
        }
      };
    }
  });

  assert.equal(called, true);
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: {
      todayOrder: '1'
    }
  });
});

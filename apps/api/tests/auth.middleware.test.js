/**
 * TP-04 鉴权中间件测试
 * 先定义后台会话拦截行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { requireAdminSession } = require('../src/middleware/auth.middleware');

test('未登录访问后台接口时应返回未登录错误', async () => {
  let jsonPayload = null;
  let statusCode = 200;
  let nextCalled = false;

  const req = {
    session: {}
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await requireAdminSession(req, res, () => {
    nextCalled = true;
  });

  assert.equal(statusCode, 401);
  assert.equal(nextCalled, false);
  assert.deepEqual(jsonPayload, {
    code: -1,
    msg: '未登录',
    data: null
  });
});

test('已登录访问后台接口时应放行到下一个处理函数', async () => {
  let nextCalled = false;
  let jsonCalled = false;

  const req = {
    session: {
      login: '1'
    }
  };

  const res = {
    status() {
      return this;
    },
    json() {
      jsonCalled = true;
      return this;
    }
  };

  await requireAdminSession(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(jsonCalled, false);
});

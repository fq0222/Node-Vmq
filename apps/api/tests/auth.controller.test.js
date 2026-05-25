/**
 * TP-04 认证控制器测试
 * 先定义登录写入会话和退出登录的控制器行为
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { loginController, logoutController } = require('../src/controllers/auth.controller');

test('登录成功时应写入 session.login=1', async () => {
  const req = {
    body: {
      user: 'admin',
      pass: 'admin'
    },
    query: {},
    session: {}
  };

  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await loginController(req, res, {
    authenticateAdmin: async () => ({
      code: 1,
      msg: '成功',
      data: null
    })
  });

  assert.equal(req.session.login, '1');
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('登录失败时不应写入 session.login', async () => {
  const req = {
    body: {
      user: 'admin',
      pass: 'wrong'
    },
    query: {},
    session: {}
  };

  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await loginController(req, res, {
    authenticateAdmin: async () => ({
      code: -1,
      msg: '账号或密码不正确',
      data: null
    })
  });

  assert.equal(req.session.login, undefined);
  assert.deepEqual(jsonPayload, {
    code: -1,
    msg: '账号或密码不正确',
    data: null
  });
});

test('退出登录时应清理 session.login 并返回成功', async () => {
  const req = {
    session: {
      login: '1'
    }
  };

  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await logoutController(req, res);

  assert.equal(req.session.login, undefined);
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

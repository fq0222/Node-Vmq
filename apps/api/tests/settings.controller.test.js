/**
 * TP-05 系统设置控制器测试
 * 先定义控制器的参数提取与兼容响应行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getSettingsController,
  saveSettingController,
  getMenuController
} = require('../src/controllers/settings.controller');

test('获取系统设置时应返回服务层结果', async () => {
  const req = {
    app: {
      locals: {
        db: {}
      }
    }
  };

  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await getSettingsController(req, res, {
    getSettings: async () => ({
      code: 1,
      msg: '成功',
      data: {
        user: 'admin'
      }
    })
  });

  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: {
      user: 'admin'
    }
  });
});

test('保存系统设置时应同时兼容 body 和 query 参数', async () => {
  const req = {
    body: {
      user: 'body-user',
      close: '5'
    },
    query: {
      pass: 'query-pass',
      payQf: '1'
    },
    app: {
      locals: {
        db: {}
      }
    }
  };

  let receivedPayload = null;
  let jsonPayload = null;

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await saveSettingController(req, res, {
    saveEditableSettings: async (payload) => {
      receivedPayload = payload;
      return {
        code: 1,
        msg: '成功',
        data: null
      };
    }
  });

  assert.equal(receivedPayload.user, 'body-user');
  assert.equal(receivedPayload.pass, 'query-pass');
  assert.equal(receivedPayload.close, '5');
  assert.equal(receivedPayload.payQf, '1');
  assert.deepEqual(jsonPayload, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('获取菜单时未登录应返回 null 以保持旧版兼容', async () => {
  const req = {
    session: {}
  };

  let jsonPayload = 'not-called';

  const res = {
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await getMenuController(req, res, {
    buildAdminMenu: () => []
  });

  assert.equal(jsonPayload, null);
});

test('获取菜单时已登录应返回菜单数组', async () => {
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

  await getMenuController(req, res, {
    buildAdminMenu: () => ([
      { name: '系统设置' }
    ])
  });

  assert.deepEqual(jsonPayload, [
    { name: '系统设置' }
  ]);
});

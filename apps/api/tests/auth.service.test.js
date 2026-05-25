/**
 * TP-04 认证服务测试
 * 先定义管理员登录校验的目标行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { authenticateAdmin } = require('../src/services/auth.service');

test('管理员账号密码正确时应返回成功结果', async () => {
  const result = await authenticateAdmin({
    user: 'admin',
    pass: 'admin'
  }, {
    getSettingValue: async (key) => {
      if (key === 'user') {
        return 'admin';
      }

      if (key === 'pass') {
        return 'admin';
      }

      return null;
    }
  });

  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('管理员账号错误时应返回失败结果', async () => {
  const result = await authenticateAdmin({
    user: 'wrong',
    pass: 'admin'
  }, {
    getSettingValue: async (key) => {
      if (key === 'user') {
        return 'admin';
      }

      if (key === 'pass') {
        return 'admin';
      }

      return null;
    }
  });

  assert.deepEqual(result, {
    code: -1,
    msg: '账号或密码不正确',
    data: null
  });
});

test('管理员密码错误时应返回失败结果', async () => {
  const result = await authenticateAdmin({
    user: 'admin',
    pass: 'wrong'
  }, {
    getSettingValue: async (key) => {
      if (key === 'user') {
        return 'admin';
      }

      if (key === 'pass') {
        return 'admin';
      }

      return null;
    }
  });

  assert.deepEqual(result, {
    code: -1,
    msg: '账号或密码不正确',
    data: null
  });
});

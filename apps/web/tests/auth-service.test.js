/**
 * 认证服务测试文件
 * 负责验证登录、退出和会话探测接口封装行为。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAdminSession,
  loginAdmin,
  logoutAdmin
} from '../src/services/auth-service.js';

test('登录请求应提交到 /login 并携带账号密码', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {
      code: 1,
      msg: '成功',
      data: null
    };
  };

  const result = await loginAdmin(
    {
      user: 'admin',
      pass: '123456'
    },
    request
  );

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/login');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(calls[0].options.body, {
    user: 'admin',
    pass: '123456'
  });
});

test('会话探测成功时应返回已登录', async () => {
  const request = async () => ({
    code: 1,
    msg: '成功',
    data: {
      login: '1'
    }
  });

  const result = await checkAdminSession(request);

  assert.deepEqual(result, {
    loggedIn: true,
    message: ''
  });
});

test('会话探测失败时应返回未登录', async () => {
  const request = async () => {
    throw new Error('未登录');
  };

  const result = await checkAdminSession(request);

  assert.deepEqual(result, {
    loggedIn: false,
    message: '当前未登录'
  });
});

test('退出登录请求应提交到 /logout', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {
      code: 1,
      msg: '成功',
      data: null
    };
  };

  const result = await logoutAdmin(request);

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/logout');
  assert.equal(calls[0].options.method, 'POST');
});

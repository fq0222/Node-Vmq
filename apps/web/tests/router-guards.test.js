/**
 * 路由守卫测试文件
 * 负责验证未登录拦截、登录页回跳和受保护页面放行逻辑。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRouteAccess } from '../src/router/guards.js';
import { ROUTE_META } from '../src/router/route-meta.js';

test('未登录访问受保护页面时应跳转到登录页', () => {
  const result = evaluateRouteAccess({
    isLoggedIn: false,
    to: { path: '/dashboard', meta: { access: ROUTE_META.PROTECTED } }
  });

  assert.deepEqual(result, {
    allow: false,
    redirectTo: '/login'
  });
});

test('已登录访问登录页时应跳转到 dashboard', () => {
  const result = evaluateRouteAccess({
    isLoggedIn: true,
    to: { path: '/login', meta: { access: ROUTE_META.PUBLIC } }
  });

  assert.deepEqual(result, {
    allow: false,
    redirectTo: '/dashboard'
  });
});

test('已登录访问受保护页面时应允许通过', () => {
  const result = evaluateRouteAccess({
    isLoggedIn: true,
    to: { path: '/orders', meta: { access: ROUTE_META.PROTECTED } }
  });

  assert.deepEqual(result, {
    allow: true,
    redirectTo: ''
  });
});

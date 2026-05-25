/**
 * 登录态存储测试文件
 * 负责验证 token 的写入、读取、清理和登录态判断行为。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearAuthToken,
  getAuthToken,
  isAuthenticated,
  setAuthToken
} from '../src/utils/auth-storage.js';

function createMemoryStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };
}

test('未写入 token 时应视为未登录', () => {
  const storage = createMemoryStorage();

  assert.equal(getAuthToken(storage), '');
  assert.equal(isAuthenticated(storage), false);
});

test('写入 token 后应能读取并视为已登录', () => {
  const storage = createMemoryStorage();

  setAuthToken(storage, 'vmq-token');

  assert.equal(getAuthToken(storage), 'vmq-token');
  assert.equal(isAuthenticated(storage), true);
});

test('清理 token 后应恢复未登录状态', () => {
  const storage = createMemoryStorage();

  setAuthToken(storage, 'vmq-token');
  clearAuthToken(storage);

  assert.equal(getAuthToken(storage), '');
  assert.equal(isAuthenticated(storage), false);
});

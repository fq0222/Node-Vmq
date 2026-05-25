/**
 * 登录态本地存储工具文件
 * 负责读写和清理后台 token，并提供最小登录态判断能力。
 */
import { AUTH_TOKEN_KEY } from '../constants/auth.js';

/**
 * 解析可用的存储对象
 * 允许测试环境传入内存存储，也兼容浏览器 localStorage。
 */
function resolveStorage(storage) {
  if (storage) {
    return storage;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return null;
}

/**
 * 读取登录 token
 * 无可用存储时返回空字符串，避免守卫逻辑报错。
 */
export function getAuthToken(storage) {
  const targetStorage = resolveStorage(storage);

  if (!targetStorage) {
    return '';
  }

  return targetStorage.getItem(AUTH_TOKEN_KEY) || '';
}

/**
 * 写入登录 token
 * 这里保留最小实现，后续真实登录接入时可直接复用。
 */
export function setAuthToken(storage, token) {
  const targetStorage = resolveStorage(storage);

  if (!targetStorage) {
    return;
  }

  targetStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * 清理登录 token
 * 退出登录或登录失效时统一走这里。
 */
export function clearAuthToken(storage) {
  const targetStorage = resolveStorage(storage);

  if (!targetStorage) {
    return;
  }

  targetStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * 判断当前是否已登录
 * 通过 token 是否存在进行最小判定。
 */
export function isAuthenticated(storage) {
  return Boolean(getAuthToken(storage));
}

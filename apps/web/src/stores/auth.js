/**
 * 后台登录态仓库文件
 * 负责维护占位登录态、初始化状态和退出行为。
 */
import { defineStore } from 'pinia';
import { clearAuthToken, getAuthToken, isAuthenticated, setAuthToken } from '../utils/auth-storage.js';

/**
 * 后台登录态仓库
 * 当前阶段使用本地 token 作为占位方案，为后续真实登录保留接口。
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    bootstrapped: false
  }),
  getters: {
    loggedIn(state) {
      return Boolean(state.token);
    }
  },
  actions: {
    bootstrap() {
      this.token = getAuthToken();
      this.bootstrapped = true;
      console.info('[TP-13][auth] 登录态初始化完成', {
        loggedIn: this.loggedIn
      });
    },
    mockLogin(token = 'vmq-admin-demo-token') {
      setAuthToken(null, token);
      this.token = token;
      console.info('[TP-13][auth] 已写入模拟登录态');
    },
    logout() {
      clearAuthToken();
      this.token = '';
      console.info('[TP-13][auth] 已清理登录态');
    },
    refresh() {
      this.token = getAuthToken();
      console.info('[TP-13][auth] 已刷新登录态', {
        loggedIn: isAuthenticated()
      });
    }
  }
});

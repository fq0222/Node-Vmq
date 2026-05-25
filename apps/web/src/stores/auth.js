/**
 * 后台登录态仓库文件
 * 负责维护基于后端 session 的登录状态、错误信息和退出行为。
 */
import { defineStore } from 'pinia';
import { checkAdminSession, loginAdmin, logoutAdmin } from '../services/auth-service.js';

/**
 * 后台登录态仓库
 * 当前阶段以后端 session 为准，前端只负责同步状态与界面反馈。
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    loggedIn: false,
    loading: false,
    errorMessage: '',
    bootstrapped: false
  }),
  actions: {
    async bootstrap() {
      await this.syncSession();
      this.bootstrapped = true;
      console.info('[TP-14][auth] 登录态初始化完成', {
        loggedIn: this.loggedIn
      });
    },
    async syncSession() {
      const result = await checkAdminSession();
      this.loggedIn = result.loggedIn;

      if (result.loggedIn) {
        this.errorMessage = '';
      }

      console.info('[TP-14][auth] 已同步后台 session 状态', {
        loggedIn: this.loggedIn
      });

      return this.loggedIn;
    },
    async login(credentials) {
      this.loading = true;
      this.errorMessage = '';

      try {
        const result = await loginAdmin(credentials);

        if (result.ok) {
          this.loggedIn = true;
          this.errorMessage = '';
          console.info('[TP-14][auth] 管理员登录成功');
          return true;
        }

        this.loggedIn = false;
        this.errorMessage = result.message || '账号或密码不正确';
        console.warn('[TP-14][auth] 管理员登录失败', {
          message: this.errorMessage
        });
        return false;
      } catch (error) {
        this.loggedIn = false;
        this.errorMessage = '登录失败，请稍后重试';
        console.error('[TP-14][auth] 登录请求异常', {
          message: error.message
        });
        return false;
      } finally {
        this.loading = false;
        this.bootstrapped = true;
      }
    },
    async logout() {
      this.loading = true;

      try {
        await logoutAdmin();
        console.info('[TP-14][auth] 管理员退出登录成功');
      } catch (error) {
        console.warn('[TP-14][auth] 退出登录请求异常，将继续清理前端状态', {
          message: error.message
        });
      } finally {
        this.markLoggedOut();
        this.loading = false;
      }
    },
    markLoggedOut(message = '') {
      this.loggedIn = false;
      this.errorMessage = message;
      this.bootstrapped = true;
      console.info('[TP-14][auth] 已清理前端登录状态', {
        message: message || 'none'
      });
    },
    clearError() {
      this.errorMessage = '';
    }
  }
});

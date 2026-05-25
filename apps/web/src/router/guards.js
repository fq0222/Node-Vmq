/**
 * 路由守卫工具文件
 * 负责封装后台受保护路由的访问判定和全局守卫注册逻辑。
 */
import { useAuthStore } from '../stores/auth.js';
import { ROUTE_META } from './route-meta.js';

/**
 * 评估目标路由是否允许访问
 * 该函数保持纯逻辑，方便通过 node:test 做独立验证。
 */
export function evaluateRouteAccess({ isLoggedIn, to }) {
  const access = to.meta?.access || ROUTE_META.PROTECTED;

  if (!isLoggedIn && access === ROUTE_META.PROTECTED) {
    return {
      allow: false,
      redirectTo: '/login'
    };
  }

  if (isLoggedIn && to.path === '/login') {
    return {
      allow: false,
      redirectTo: '/dashboard'
    };
  }

  return {
    allow: true,
    redirectTo: ''
  };
}

/**
 * 注册全局鉴权守卫
 * 守卫统一从 auth store 读取真实登录态，避免继续依赖本地 token。
 */
export function registerAuthGuard(router, pinia) {
  router.beforeEach((to) => {
    const authStore = useAuthStore(pinia);
    const result = evaluateRouteAccess({
      isLoggedIn: authStore.loggedIn,
      to
    });

    if (!result.allow) {
      console.info('[TP-14][router] 路由访问被重定向', {
        from: to.path,
        redirectTo: result.redirectTo
      });
      return result.redirectTo;
    }

    return true;
  });
}

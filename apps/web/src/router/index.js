/**
 * 前端路由入口文件
 * 负责创建路由实例并在应用初始化阶段挂载全局鉴权守卫。
 */
import { createRouter, createWebHistory } from 'vue-router';
import { registerAuthGuard } from './guards.js';
import { routes } from './routes.js';

let guardRegistered = false;

const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * 初始化路由守卫
 * 避免重复注册 beforeEach，保证路由日志和重定向行为稳定。
 */
export function initializeRouterGuards(pinia) {
  if (guardRegistered) {
    return;
  }

  registerAuthGuard(router, pinia);
  guardRegistered = true;
}

export default router;

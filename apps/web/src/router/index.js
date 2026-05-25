/**
 * 前端路由入口文件
 * 负责创建路由实例并挂载全局鉴权守卫。
 */
import { createRouter, createWebHistory } from 'vue-router';
import { registerAuthGuard } from './guards.js';
import { routes } from './routes.js';

/**
 * 前端路由入口
 * 统一组装路由树与全局鉴权守卫，避免入口文件职责过重。
 */
const router = createRouter({
  history: createWebHistory(),
  routes
});

registerAuthGuard(router);

export default router;

/**
 * 前端路由模块
 * 当前阶段仅提供基础首页路由，后续再扩展后台页面
 */

import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

/**
 * 路由表定义
 * 先建立最小骨架，便于后续逐步增加页面
 */
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  }
];

/**
 * 创建路由实例
 */
const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

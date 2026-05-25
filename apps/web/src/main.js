/**
 * 前端应用启动入口文件
 * 负责初始化 Vue、Pinia、路由、session 探测和统一未授权处理。
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router, { initializeRouterGuards } from './router';
import { setUnauthorizedHandler } from './services/api-client.js';
import { useAuthStore } from './stores/auth.js';
import './styles/global.css';

/**
 * 启动前端应用
 * 先完成会话探测与守卫初始化，再挂载应用，避免首屏误跳转。
 */
async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  console.info('[TP-14][main] 正在初始化前端登录与鉴权流程');

  app.use(pinia);

  const authStore = useAuthStore(pinia);
  await authStore.bootstrap();

  initializeRouterGuards(pinia);
  app.use(router);

  setUnauthorizedHandler(() => {
    authStore.markLoggedOut('当前会话已失效，请重新登录');
    if (router.currentRoute.value.path !== '/login') {
      router.push('/login');
    }
  });

  app.mount('#app');

  console.info('[TP-14][main] 前端登录与鉴权流程初始化完成');
}

bootstrap();
